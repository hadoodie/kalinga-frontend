<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MessageSent implements ShouldBroadcastNow
{
    use Dispatchable;
    use InteractsWithSockets;
    use SerializesModels;

    public function __construct(
        public array $message,
        public array $conversation,
        public int $senderId,
        public ?int $receiverId,
        public ?int $groupId = null,
        public bool $suppressCurrentUser = true,
    ) {
        if ($this->suppressCurrentUser) {
            $this->dontBroadcastToCurrentUser();
        }
    }

    public function broadcastOn(): array
    {
        $channels = [];

        // Notify the sender so that other devices stay in sync.
        $channels[] = new PrivateChannel('chat.user.' . $this->senderId);

        // Notify the direct message receiver when applicable.
        if ($this->receiverId) {
            $channels[] = new PrivateChannel('chat.user.' . $this->receiverId);
        }

        // Broadcast to group channel if this was a group message.
        if ($this->groupId) {
            $channels[] = new PrivateChannel('chat.group.' . $this->groupId);
        }

        return $channels;
    }

    public function broadcastAs(): string
    {
        return 'message.sent';
    }

    public function broadcastWith(): array
    {
        return [
            'message' => $this->message,
            'conversation' => $this->conversation,
        ];
    }
}
