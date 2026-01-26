<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ResponderSeeder extends Seeder
{
    public function run()
    {
        DB::table('responders')->truncate();

        $responders = [
            ['responder_code'=>'RSP-001','user_id'=>2,'full_name'=>'Juan Dela Cruz','contact_number'=>'09171234567','handling_capabilities'=>json_encode(['ColdChain','General']),'status'=>'Available','created_by'=>1],
            ['responder_code'=>'RSP-002','user_id'=>3,'full_name'=>'Maria Santos','contact_number'=>'09189876543','handling_capabilities'=>json_encode(['Narcotics','HighValue']),'status'=>'Available','created_by'=>1],
            ['responder_code'=>'RSP-003','user_id'=>4,'full_name'=>'Pedro Reyes','contact_number'=>'09205551234','handling_capabilities'=>json_encode(['General','ColdChain']),'status'=>'Available','created_by'=>1],
            ['responder_code'=>'RSP-004','user_id'=>5,'full_name'=>'Ana Lim','contact_number'=>'09394445678','handling_capabilities'=>json_encode(['General']),'status'=>'Available','created_by'=>1],
            ['responder_code'=>'RSP-005','user_id'=>6,'full_name'=>'Jose Tan','contact_number'=>'09957778888','handling_capabilities'=>json_encode(['ColdChain','Narcotics']),'status'=>'Available','created_by'=>1],
            ['responder_code'=>'RSP-006','user_id'=>7,'full_name'=>'Luz Cruz','contact_number'=>'09152223333','handling_capabilities'=>json_encode(['General']),'status'=>'Available','created_by'=>1],
        ];

        foreach ($responders as $r) {
            DB::table('responders')->insert(array_merge($r, [
                'created_at' => now(),
                'updated_at' => now(),
            ]));
        }
    }
}