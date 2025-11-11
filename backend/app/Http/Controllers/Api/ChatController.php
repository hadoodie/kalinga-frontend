<?php

namespace App\Http\Controllers\Api;

use App\Events\MessageSent;
use App\Http\Controllers\Controller;
use App\Models\Conversation;
use App\Models\Message;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ChatController extends Controller
{
    public function getConversations(Request $request)
    {
        $user = $request->user();

        $messages = Message::with([
            'sender:id,name,role,profile_image',
            'receiver:id,name,role,profile_image',
        ])
            ->whereNull('group_id')
            ->where(function ($query) use ($user) {
                $query->where('sender_id', $user->id)
                    ->orWhere('receiver_id', $user->id);
            })
            ->orderBy('created_at')
            ->get();

        if ($messages->isEmpty()) {
            return response()->json([
                'data' => [],
            ]);
        }

        $conversationRecords = Conversation::query()
            ->where(function ($query) use ($user) {
                $query->where('user_id1', $user->id)
                    ->orWhere('user_id2', $user->id);
            })
            ->get();

        $conversationIndex = $conversationRecords->mapWithKeys(function ($conversation) {
            $keyParts = collect([$conversation->user_id1, $conversation->user_id2])->sort()->implode('-');

            return [$keyParts => $conversation->id];
        });

        $conversations = [];

        foreach ($messages as $message) {
            $otherUser = $message->sender_id === $user->id
                ? $message->receiver
                : $message->sender;

            if (!$otherUser) {
                continue;
            }

            $conversationKey = collect([$user->id, $otherUser->id])->sort()->implode('-');
            $conversationId = $conversationIndex[$conversationKey] ?? null;

            if (!isset($conversations[$conversationKey])) {
                $participantPayload = [
                    'id' => $otherUser->id,
                    'name' => $otherUser->name,
                    'role' => $otherUser->role,
                    'avatar' => $otherUser->profile_image,
                    'profile_image' => $otherUser->profile_image,
                ];

                $selfPayload = [
                    'id' => $user->id,
                    'name' => $user->name,
                    'role' => $user->role,
                    'avatar' => $user->profile_image,
                    'profile_image' => $user->profile_image,
                ];

                $conversations[$conversationKey] = [
                    'id' => $conversationId ?? 'user-' . $otherUser->id,
                    'conversationId' => $conversationId,
                    'participant' => $participantPayload,
                    'participants' => [$participantPayload, $selfPayload],
                    'category' => $this->mapCategory($otherUser->role),
                    'unreadCount' => 0,
                    'isArchived' => false,
                    'messages' => [],
                ];
            }

            $conversations[$conversationKey]['messages'][] = [
                'id' => $message->id,
                'text' => $message->message,
                'senderId' => $message->sender_id,
                'receiverId' => $message->receiver_id,
                'sender' => $message->sender?->name,
                'timestamp' => optional($message->created_at)->toIso8601String(),
            ];
        }

        $normalized = collect($conversations)
            ->map(function (array $conversation) {
                $messages = collect($conversation['messages'])
                    ->sortBy('timestamp')
                    ->values()
                    ->map(function (array $message) {
                        return [
                            'id' => $message['id'],
                            'text' => $message['text'],
                            'senderId' => $message['senderId'],
                            'receiverId' => $message['receiverId'],
                            'sender' => $message['sender'],
                            'timestamp' => $message['timestamp'],
                            'isRead' => true,
                            'isSystemMessage' => false,
                        ];
                    })
                    ->values();

                $lastMessage = $messages->last();

                return [
                    'id' => $conversation['id'],
                    'conversationId' => $conversation['conversationId'],
                    'participant' => $conversation['participant'],
                    'category' => $conversation['category'],
                    'unreadCount' => $conversation['unreadCount'],
                    'isArchived' => $conversation['isArchived'],
                    'lastMessage' => $lastMessage['text'] ?? null,
                    'lastMessageTime' => $lastMessage['timestamp'] ?? null,
                    'messages' => $messages,
                ];
            })
            ->sortByDesc('lastMessageTime')
            ->values();

        return response()->json([
            'data' => $normalized,
        ]);
    }

    public function getMessages(Request $request, int $otherUserId)
    {
        $user = $request->user();

        $messages = Message::with([
            'sender:id,name',
            'receiver:id,name',
        ])
            ->whereNull('group_id')
            ->where(function ($query) use ($user, $otherUserId) {
                $query->where(function ($inner) use ($user, $otherUserId) {
                    $inner->where('sender_id', $user->id)
                        ->where('receiver_id', $otherUserId);
                })->orWhere(function ($inner) use ($user, $otherUserId) {
                    $inner->where('sender_id', $otherUserId)
                        ->where('receiver_id', $user->id);
                });
            })
            ->orderBy('created_at')
            ->get()
            ->map(function (Message $message) use ($user) {
                return [
                    'id' => $message->id,
                    'text' => $message->message,
                    'senderId' => $message->sender_id,
                    'receiverId' => $message->receiver_id,
                    'sender' => $message->sender?->name,
                    'timestamp' => optional($message->created_at)->toIso8601String(),
                    'isRead' => true,
                    'isSystemMessage' => false,
                    'isOwn' => $message->sender_id === $user->id,
                ];
            });

        return response()->json([
            'data' => $messages,
        ]);
    }

    public function sendMessage(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'receiver_id' => ['required', 'integer', 'exists:users,id'],
            'message' => ['required_without:group_id', 'nullable', 'string'],
            'group_id' => ['nullable', 'integer', 'exists:groups,id'],
        ]);

        if ((int) $validated['receiver_id'] === $user->id && empty($validated['group_id'])) {
            throw ValidationException::withMessages([
                'receiver_id' => 'You cannot send a direct message to yourself.',
            ]);
        }

        $receiverId = (int) $validated['receiver_id'];
        $groupId = $validated['group_id'] ?? null;

        $conversationId = null;

        if (!$groupId) {
            $conversation = $this->firstOrCreateConversation($user->id, $receiverId);
            $conversationId = $conversation->id;
        }

        $message = Message::create([
            'message' => $validated['message'],
            'sender_id' => $user->id,
            'receiver_id' => $groupId ? null : $receiverId,
            'group_id' => $groupId,
            'conversation_id' => $conversationId,
        ]);

        if ($conversationId) {
            Conversation::whereKey($conversationId)->update([
                'last_message_id' => $message->id,
            ]);
        } elseif ($groupId) {
            DB::table('groups')
                ->where('id', $groupId)
                ->update(['last_message_id' => $message->id]);
        }

        $message->load(['sender:id,name,role,profile_image', 'receiver:id,name,role,profile_image']);

        $senderPayload = $message->sender ? [
            'id' => $message->sender->id,
            'name' => $message->sender->name,
            'role' => $message->sender->role,
            'avatar' => $message->sender->profile_image,
            'profile_image' => $message->sender->profile_image,
        ] : null;

        $receiverPayload = $message->receiver ? [
            'id' => $message->receiver->id,
            'name' => $message->receiver->name,
            'role' => $message->receiver->role,
            'avatar' => $message->receiver->profile_image,
            'profile_image' => $message->receiver->profile_image,
        ] : null;

        $participant = $receiverPayload ?? $senderPayload;

        $timestamp = optional($message->created_at)->toIso8601String();

        $messagePayload = [
            'id' => $message->id,
            'text' => $message->message,
            'senderId' => $message->sender_id,
            'receiverId' => $message->receiver_id,
            'sender' => $message->sender?->name,
            'timestamp' => $timestamp,
            'isRead' => false,
            'isSystemMessage' => false,
        ];

        $conversationPayload = [
            'id' => $conversationId ?? 'user-' . ($participant['id'] ?? 'unknown'),
            'conversationId' => $conversationId,
            'participant' => $participant,
            'participants' => collect([$senderPayload, $receiverPayload])->filter()->values()->all(),
            'sender' => $senderPayload,
            'receiver' => $receiverPayload,
            'category' => $this->mapCategory($participant['role'] ?? null),
            'unreadCount' => 0,
            'isArchived' => false,
            'lastMessage' => $message->message,
            'lastMessageTime' => $timestamp,
            'messages' => [$messagePayload],
        ];

        broadcast(new MessageSent(
            message: $messagePayload,
            conversation: $conversationPayload,
            senderId: $user->id,
            receiverId: $groupId ? null : $receiverId,
            groupId: $groupId,
        ));

        return response()->json([
            'data' => array_merge($messagePayload, [
                'isOwn' => true,
                'conversationId' => $conversationId,
                'participant' => $conversationPayload['participant'],
                'participants' => $conversationPayload['participants'],
                'receiver' => $receiverPayload,
                'sender' => $senderPayload,
            ]),
        ], 201);
    }

    public function deleteMessage(Request $request, int $messageId)
    {
        $user = $request->user();

        $message = Message::where('id', $messageId)
            ->where(function ($query) use ($user) {
                $query->where('sender_id', $user->id)
                    ->orWhere('receiver_id', $user->id);
            })
            ->firstOrFail();

        $message->delete();

        return response()->json([
            'status' => 'deleted',
        ]);
    }

    private function firstOrCreateConversation(int $userId, int $otherUserId): Conversation
    {
        $ids = collect([$userId, $otherUserId])->sort()->values();

        return Conversation::firstOrCreate([
            'user_id1' => $ids[0],
            'user_id2' => $ids[1],
        ]);
    }

    private function mapCategory(?string $role): string
    {
        return match ($role) {
            'patient' => 'Patient',
            'responder' => 'Responder',
            'admin' => 'Admin',
            'logistics' => 'Logistics',
            default => 'General',
        };
    }
}
