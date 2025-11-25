<?php

namespace Database\Seeders;

use App\Models\Message;
use App\Models\Group;
use App\Models\User;
use App\Models\Conversation;

// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

class MessagesSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $ownerUser = User::where('email', 'admin@kalinga.com')->first() ?? User::first();
        if (!$ownerUser) {
            $this->command?->warn('MessagesSeeder skipped because no users are available to own groups.');
            return;
        }

        for ($i = 0; $i < 5; $i++) {
            $group = Group::factory()->create([
                'owner_id' => $ownerUser->id,
            ]);

            $users = User::inRandomOrder()
                ->limit(random_int(2, 5))
                ->pluck('id')
                ->toArray();
            $participants = array_unique([$ownerUser->id, ...$users]);
            $group->users()->attach($participants);

            Message::factory(1000)->create();
            $messages = Message::whereNull('group_id')->orderBy('created_at')->get();

            $conversations = $messages->groupBy(function ($message) {
                return collect([$message->sender_id, $message->receiver_id])->sort()->implode('_');
            })->map(function ($groupedMessages) {
                return [
                    'user_id1' => $groupedMessages->first()->sender_id,
                    'user_id2' => $groupedMessages->first()->receiver_id,
                    'last_message_id' => $groupedMessages->last()->id,
                    'created_at' => new Carbon(),
                    'updated_at' => new Carbon(),
                ];
            })->values();

            Conversation::insertOrIgnore($conversations->toArray());
        }

        $responder = User::where('email', 'responder_verified@kalinga.com')->first();
        $janeDoe = User::where('email', 'jane.doe@kalinga.com')->first();

        if ($responder && $janeDoe) {
            $participantIds = collect([$responder->id, $janeDoe->id])->sort()->values();

            $conversation = Conversation::updateOrCreate(
                [
                    'user_id1' => $participantIds[0],
                    'user_id2' => $participantIds[1],
                ],
                []
            );

            $scriptedMessages = [
                [
                    'sender_id' => $responder->id,
                    'receiver_id' => $janeDoe->id,
                    'message' => 'Hi Jane, this is Responder Verified. I am en route to Barangay 5 to assist with the reported landslide.',
                ],
                [
                    'sender_id' => $janeDoe->id,
                    'receiver_id' => $responder->id,
                    'message' => 'Copy, I am already on site coordinating with the barangay captain. Roads are partially blocked but passable.',
                ],
                [
                    'sender_id' => $responder->id,
                    'receiver_id' => $janeDoe->id,
                    'message' => 'Great. Please prepare the triage area near the covered court. ETA for my team is 12 minutes.',
                ],
                [
                    'sender_id' => $janeDoe->id,
                    'receiver_id' => $responder->id,
                    'message' => 'Understood. We have volunteers clearing debris and a nurse setting up. Will share patient intake as soon as they arrive.',
                ],
                [
                    'sender_id' => $responder->id,
                    'receiver_id' => $janeDoe->id,
                    'message' => 'Thanks, Jane. Keep the updates coming. I will radio in once we deploy the medical tent.',
                ],
            ];

            $baseTime = Carbon::now()->subMinutes(30);
            $lastMessage = null;

            foreach ($scriptedMessages as $index => $payload) {
                $createdAt = (clone $baseTime)->addMinutes($index * 4);

                $messageModel = Message::firstOrNew([
                    'conversation_id' => $conversation->id,
                    'sender_id' => $payload['sender_id'],
                    'receiver_id' => $payload['receiver_id'],
                    'message' => $payload['message'],
                ]);

                $messageModel->group_id = null;
                $messageModel->save();

                Message::whereKey($messageModel->id)->update([
                    'created_at' => $createdAt,
                    'updated_at' => $createdAt,
                ]);

                $lastMessage = $messageModel->fresh();
            }

            if ($lastMessage) {
                $conversation->update([
                    'last_message_id' => $lastMessage->id,
                ]);
            }
        }
    }
}
