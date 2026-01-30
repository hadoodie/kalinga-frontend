<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\Process\Process;
use Symfony\Component\Process\Exception\ProcessFailedException;

class OCRController extends Controller
{
    public function processImage(Request $request)
    {
        $file = null;

        try {
            $request->validate([
                'image' => 'required|image|max:10240',
            ]);

            $relativePath = $request->file('image')->store('temp_ids', 'local');
            
            $fullPath = Storage::disk('local')->path($relativePath);

            if (!file_exists($fullPath)) {
                return response()->json([
                    'error' => 'File Save Error', 
                    'details' => "Laravel reported save success, but file is missing at: $fullPath"
                ], 500);
            }

            $file = $fullPath;

            $possiblePaths = [
                base_path('.venv/Scripts/python.exe'),
                base_path('venv/Scripts/python.exe'),
                'python', 
                'py' 
            ];

            $pythonPath = null;
            foreach ($possiblePaths as $p) {
                if ((str_contains($p, '/') || str_contains($p, '\\')) && file_exists($p)) {
                    $pythonPath = $p;
                    break;
                }
                if (!str_contains($p, '/') && !str_contains($p, '\\')) {
                     $pythonPath = $p; 
                     break;
                }
            }

            if (!$pythonPath) {
                return response()->json(['error' => 'Config Error', 'details' => 'Python not found'], 500);
            }

            $scriptPath = base_path('python_scripts/ocr_parser.py');
            
            $process = new Process([$pythonPath, $scriptPath, $fullPath]);
            $process->run();

            if (!$process->isSuccessful()) {
                @unlink($fullPath);
                
                return response()->json([
                    'error' => 'Python Error',
                    'details' => $process->getErrorOutput(),
                    'output' => $process->getOutput() 
                ], 500);
            }

            @unlink($fullPath);
            
            $output = $process->getOutput();
            
            $json = json_decode($output);
            if (json_last_error() !== JSON_ERROR_NONE) {
                 return response()->json([
                    'error' => 'JSON Error',
                    'details' => 'Python script did not return valid JSON',
                    'raw_output' => $output
                ], 500);
            }

            return response()->json($json);

        } catch (\Exception $e) {
            if ($file && file_exists($file)) @unlink($file);

            return response()->json([
                'error' => 'Server Error',
                'details' => $e->getMessage()
            ], 500);
        }
    }
}