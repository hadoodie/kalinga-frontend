<?php

namespace App\Services;

use App\Models\Incident;
use App\Models\Message;
use Carbon\Carbon;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;

class IncidentIntelService
{
    private const KEYWORD_GROUPS = [
        'symptoms' => [
            'burns' => ['burn', 'scald', 'blister', 'scorch'],
            'bleeding' => ['bleed', 'blood', 'hemorrhage'],
            'breathing' => ['breath', 'breathing', 'asthma', 'choke', 'smoke'],
            'trauma' => ['fracture', 'broken', 'crush', 'impact', 'injury'],
            'nausea' => ['nausea', 'vomit', 'dizzy', 'headache'],
        ],
        'hazards' => [
            'fire' => ['fire', 'flame', 'burning', 'smoke'],
            'flood' => ['flood', 'water level', 'rising water'],
            'structural' => ['collapse', 'debris', 'building', 'structure'],
            'chemical' => ['chemical', 'tox', 'leak', 'hazmat'],
            'violence' => ['attack', 'weapon', 'threat'],
        ],
        'location' => [
            'materials' => ['wood', 'gas', 'fuel', 'chemical'],
            'setting' => ['house', 'apartment', 'road', 'highway', 'factory'],
            'constraints' => ['blocked', 'trap', 'stuck', 'no exit'],
        ],
    ];

    private const URGENCY_HINTS = [
        'hurry',
        "can't breathe",
        'urgent',
        'unconscious',
        'massive bleeding',
        'fire spreading',
        'explosion',
        'critical',
    ];

    public function updateFromMessage(Incident $incident, Message $message): ?array
    {
        $message->loadMissing('sender:id,role');

        $senderRole = optional($message->sender)->role;
        if (!$senderRole || mb_strtolower($senderRole) !== 'patient') {
            return null;
        }

        $text = $this->normalizeText($message->message ?? '');
        if ($text === '') {
            return null;
        }

        $metadata = $this->normalizeMetadata($incident->metadata);
        $insights = $this->normalizeInsights(Arr::get($metadata, 'conversation_insights'));

        $classification = $this->classifyText($text);

        $insights['symptoms'] = $this->mergeUnique($insights['symptoms'], $classification['symptoms']);
        $insights['hazards'] = $this->mergeUnique($insights['hazards'], $classification['hazards']);
        $insights['location'] = $this->mergeUnique($insights['location'], $classification['location']);
        $insights['urgencyCue'] = $classification['urgencyCue'] ?? $insights['urgencyCue'];

        $insights['recent_statements'] = $this->trackRecentStatements(
            $insights['recent_statements'] ?? [],
            $message->id,
            $message->message,
            optional($message->created_at)?->toIso8601String()
        );

        $insights['latest_statement'] = end($insights['recent_statements']) ?: null;
        $insights['last_message_id'] = $message->id;
        $insights['updated_at'] = now()->toIso8601String();
        $insights['summary'] = $this->buildSummary($insights);

        $metadata['conversation_insights'] = $insights;
        $description = $this->buildIncidentDescription($incident, $metadata, $insights);

        $incident->forceFill([
            'metadata' => $metadata,
            'description' => $description,
        ])->save();

        return $insights;
    }

    private function normalizeMetadata($metadata): array
    {
        if (is_array($metadata)) {
            return $metadata;
        }

        if ($metadata instanceof Collection) {
            return $metadata->toArray();
        }

        return [];
    }

    private function normalizeInsights($payload): array
    {
        if (!is_array($payload)) {
            $payload = [];
        }

        return [
            'symptoms' => array_values(array_unique($payload['symptoms'] ?? [])),
            'hazards' => array_values(array_unique($payload['hazards'] ?? [])),
            'location' => array_values(array_unique($payload['location'] ?? [])),
            'urgencyCue' => $payload['urgencyCue'] ?? null,
            'summary' => $payload['summary'] ?? null,
            'recent_statements' => $payload['recent_statements'] ?? [],
            'latest_statement' => $payload['latest_statement'] ?? null,
            'last_message_id' => $payload['last_message_id'] ?? null,
            'updated_at' => $payload['updated_at'] ?? null,
        ];
    }

    private function classifyText(string $text): array
    {
        $symptoms = $this->matchGroups('symptoms', $text);
        $hazards = $this->matchGroups('hazards', $text);
        $location = $this->matchGroups('location', $text);

        $urgencyCue = null;
        foreach (self::URGENCY_HINTS as $hint) {
            if (str_contains($text, $hint)) {
                $urgencyCue = $hint;
                break;
            }
        }

        return compact('symptoms', 'hazards', 'location', 'urgencyCue');
    }

    private function matchGroups(string $group, string $text): array
    {
        if (!isset(self::KEYWORD_GROUPS[$group])) {
            return [];
        }

        $matches = [];
        foreach (self::KEYWORD_GROUPS[$group] as $label => $keywords) {
            foreach ($keywords as $keyword) {
                if (str_contains($text, $keyword)) {
                    $matches[] = $label;
                    break;
                }
            }
        }

        return array_values(array_unique($matches));
    }

    private function mergeUnique(array $current, array $incoming): array
    {
        return array_values(array_unique(array_merge($current, $incoming)));
    }

    private function trackRecentStatements(array $existing, $messageId, ?string $text, ?string $timestamp): array
    {
        if (!$text) {
            return $existing;
        }

        $existing[] = array_filter([
            'id' => $messageId,
            'text' => $text,
            'timestamp' => $timestamp,
        ]);

        $existing = array_values(array_filter($existing, function ($item) {
            return !empty($item['text']);
        }));

        if (count($existing) > 5) {
            $existing = array_slice($existing, -5);
        }

        return $existing;
    }

    private function buildSummary(array $insights): string
    {
        $parts = [];

        if (!empty($insights['symptoms'])) {
            $parts[] = 'Patient reports ' . implode(', ', $this->humanize($insights['symptoms']));
        }

        if (!empty($insights['hazards'])) {
            $parts[] = 'Hazards detected: ' . implode(', ', $this->humanize($insights['hazards']));
        }

        if (!empty($insights['location'])) {
            $parts[] = 'Environment clues: ' . implode(', ', $this->humanize($insights['location']));
        }

        if (!empty($insights['urgencyCue'])) {
            $parts[] = 'Urgency flagged (' . $insights['urgencyCue'] . ') — notify dispatch immediately.';
        }

        if (empty($parts)) {
            return 'Monitoring patient chatter — no critical signals yet.';
        }

        return implode(' ', $parts);
    }

    private function humanize(array $values): array
    {
        return array_map(function ($value) {
            return str_replace('_', ' ', $value);
        }, $values);
    }

    private function buildIncidentDescription(Incident $incident, array &$metadata, array $insights): string
    {
        $base = $metadata['base_description'] ?? $incident->description ?? '';

        if ($base === '' && $incident->type) {
            $base = ucfirst($incident->type) . ' reported.';
        }

        if ($base === '' && $incident->location) {
            $base = 'Incident near ' . $incident->location;
        }

        if (!isset($metadata['base_description'])) {
            $metadata['base_description'] = $base;
        }

        if ($insights['summary'] === null) {
            return $base;
        }

        $lines = [$metadata['base_description']];
        $lines[] = '';
        $lines[] = '---';
        $lines[] = 'Live intel (updated ' . $this->formatTimestamp($insights['updated_at']) . '):';
        $lines[] = $insights['summary'];

        if (!empty($insights['symptoms'])) {
            $lines[] = 'Symptoms / injuries: ' . implode(', ', $this->humanize($insights['symptoms']));
        }

        if (!empty($insights['hazards'])) {
            $lines[] = 'Hazards nearby: ' . implode(', ', $this->humanize($insights['hazards']));
        }

        if (!empty($insights['location'])) {
            $lines[] = 'Environment clues: ' . implode(', ', $this->humanize($insights['location']));
        }

        if (!empty($insights['recent_statements'])) {
            $lines[] = 'Latest patient statements:';
            foreach ($insights['recent_statements'] as $statement) {
                $time = $this->formatTimestamp($statement['timestamp'], 'g:i A') ?? 'Recent';
                $lines[] = '- ' . $time . ' — ' . $statement['text'];
            }
        }

        return trim(implode("\n", array_filter($lines, fn ($line) => $line !== null)));
    }

    private function formatTimestamp(?string $value, string $format = 'M j, g:i A T'): ?string
    {
        if (!$value) {
            return null;
        }

        try {
            return Carbon::parse($value)
                ->setTimezone(config('app.timezone') ?? 'UTC')
                ->format($format);
        } catch (\Throwable $exception) {
            return null;
        }
    }

    private function normalizeText(string $text): string
    {
        return mb_strtolower(trim($text));
    }
}
