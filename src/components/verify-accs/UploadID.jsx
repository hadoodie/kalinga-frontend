import { useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { X, ScanLine, Loader2, Camera, Upload } from "lucide-react";
import Tesseract from 'tesseract.js';

export default function UploadID() {
  const location = useLocation();
  const navigate = useNavigate();
  const canvasRef = useRef(null);

  const { selectedID } = location.state || {};
  
  // State for Front ID
  const [frontFile, setFrontFile] = useState(null);
  const [frontPreview, setFrontPreview] = useState(null);

  // State for Back ID
  const [backFile, setBackFile] = useState(null);
  const [backPreview, setBackPreview] = useState(null);

  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState("");
  const [extractedText, setExtractedText] = useState("");

  // Handle file selection 
  const handleFileChange = (e, type) => {
    const uploadedFile = e.target.files[0];
    if (uploadedFile) {
      if (type === 'front') {
        setFrontFile(uploadedFile);
        setFrontPreview(URL.createObjectURL(uploadedFile));
      } else {
        setBackFile(uploadedFile);
        setBackPreview(URL.createObjectURL(uploadedFile));
      }
    }
  };

  const handleRemoveFile = (type) => {
    if (type === 'front') {
      setFrontFile(null);
      setFrontPreview(null);
      if(document.getElementById("front-upload")) document.getElementById("front-upload").value = "";
    } else {
      setBackFile(null);
      setBackPreview(null);
      if(document.getElementById("back-upload")) document.getElementById("back-upload").value = "";
    }
  };

  // --- IMAGE PRE-PROCESSING ---
  const preprocessImage = (imageFile) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = URL.createObjectURL(imageFile);
      img.onload = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        
        // Draw original image
        ctx.drawImage(img, 0, 0);
        
        // Get raw pixel data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Apply Grayscale & High Contrast
        for (let i = 0; i < data.length; i += 4) {
          const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
          const color = avg > 120 ? 255 : 0; 
          data[i] = color;     
          data[i + 1] = color; 
          data[i + 2] = color; 
        }
        
        ctx.putImageData(imageData, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
    });
  };

  const handleScanAndNext = async (e) => {
    e.preventDefault();
    if (!frontFile || !backFile) {
      alert("Please upload both the Front and Back of your ID.");
      return;
    }

    setIsScanning(true);
    setScanStatus("Cleaning image...");

    try {
      const cleanImageURL = await preprocessImage(frontFile);
      
      setScanStatus("Reading text from front ID...");
      
      const result = await Tesseract.recognize(
        cleanImageURL,
        'eng',
        { logger: m => {
            if(m.status === 'recognizing text') {
              setScanStatus(`Scanning... ${Math.round(m.progress * 100)}%`);
            }
          } 
        }
      );

      const text = result.data.text;
      console.log("=== EXTRACTED TEXT ===");
      console.log(text);
      console.log("=== END EXTRACTED TEXT ===");
      
      setExtractedText(text);

      setScanStatus("Analyzing data...");
      const extractedData = parseIDText(text, selectedID);
      console.log("=== PARSED DATA ===");
      console.log(extractedData);
      console.log("=== END PARSED DATA ===");

      navigate("/fill-info", { 
        state: { 
          selectedID, 
          frontFile,
          backFile,
          scannedData: extractedData 
        } 
      });

    } catch (error) {
      console.error("OCR Error:", error);
      alert("Auto-scan failed. Please enter details manually.\n\nError: " + error.message);
      navigate("/fill-info", { state: { selectedID, frontFile, backFile } });
    } finally {
      setIsScanning(false);
    }
  };

  // ==================== SPECIALIZED PHILIPPINE NATIONAL ID PARSER ====================
  const parsePhilippineNationalID = (text, lines) => {
    console.log("=== USING PHILIPPINE NATIONAL ID PARSER ===");
    console.log("All lines:", lines);
    
    const data = {
      idNumber: "",
      firstName: "",
      lastName: "",
      middleName: "",
      birthYear: "",
      birthMonth: "",
      birthDay: "",
      address: ""
    };

    // === EXTRACT PCN (Philippine Identification Number) ===
    // Format: ####-####-####-####
    const pcnPattern = /\b([0-9]{4}[-\s]?[0-9]{4}[-\s]?[0-9]{4}[-\s]?[0-9]{4})\b/;
    const pcnMatch = text.match(pcnPattern);
    if (pcnMatch) {
      data.idNumber = pcnMatch[1].replace(/\s+/g, '');
      console.log("Found PCN:", data.idNumber);
    }

    // Clean and normalize lines for better matching
    const cleanLines = lines.map(l => l.replace(/\s+/g, ' ').trim());
    
    // === STRATEGY 1: Look for specific field indicators and grab the line that follows ===
    
    // Find Last Name (Apelyido)
    const lastNameIndex = cleanLines.findIndex(line => 
      /Apelyido/i.test(line) || /Last\s*Name/i.test(line)
    );
    
    if (lastNameIndex !== -1) {
      console.log("Found 'Last Name' label at index:", lastNameIndex, "=>", cleanLines[lastNameIndex]);
      
      // Check next 5 lines for the actual last name
      for (let i = lastNameIndex + 1; i <= lastNameIndex + 5 && i < cleanLines.length; i++) {
        const line = cleanLines[i];
        console.log(`Checking line ${i}:`, line);
        
        // Must be uppercase, letters/spaces only, reasonable length
        // Exclude common header/label words and address keywords
        if (/^[A-Z][A-Z\s]{2,25}$/.test(line) && 
            !/REPUBLIKA|REPUBLIC|PHILIPPINE|PAMBANSANG|CARD|IDENTIFICATION|MGA|PANGALAN|GIVEN|GITNANG|MIDDLE|PETSA|DATE|BIRTH|TIRAHAN|ADDRESS|PUROK|NAREGTA|LANAT|SAN|MANUEL|TARLAC|BARANGAY|BRGY/i.test(line)) {
          data.lastName = line;
          console.log("✓ Found Last Name:", data.lastName, "at line", i);
          break;
        }
      }
    }

    // Find First Name (Mga Pangalan/Given Names)
    const firstNameIndex = cleanLines.findIndex(line => 
      /Mga\s*Pangalan/i.test(line) || /Given\s*Names?/i.test(line)
    );
    
    if (firstNameIndex !== -1) {
      console.log("Found 'Given Names' label at index:", firstNameIndex, "=>", cleanLines[firstNameIndex]);
      
      // Check next 5 lines
      for (let i = firstNameIndex + 1; i <= firstNameIndex + 5 && i < cleanLines.length; i++) {
        const line = cleanLines[i];
        console.log(`Checking line ${i}:`, line);
        
        // Can contain multiple words and possibly middle initial
        // Exclude address-related words
        if (/^[A-Z][A-Z\s]{2,35}$/.test(line) && 
            !/REPUBLIKA|REPUBLIC|PHILIPPINE|PAMBANSANG|CARD|IDENTIFICATION|APELYIDO|LAST|GITNANG|MIDDLE|PETSA|DATE|BIRTH|TIRAHAN|ADDRESS|PUROK|NAREGTA|LANAT|SAN|MANUEL|TARLAC|BARANGAY|BRGY/i.test(line)) {
          
          // Check if line contains middle initial pattern (single letter with optional dot)
          const nameParts = line.split(/\s+/);
          const middleInitialIndex = nameParts.findIndex(part => /^[A-Z]\.?$/.test(part));
          
          if (middleInitialIndex !== -1 && middleInitialIndex > 0) {
            // Everything before middle initial is first name
            data.firstName = nameParts.slice(0, middleInitialIndex).join(' ');
            // Middle initial
            if (!data.middleName) {
              data.middleName = nameParts[middleInitialIndex].replace('.', '');
            }
            console.log("✓ Found First Name with middle initial:", data.firstName, data.middleName, "at line", i);
          } else {
            data.firstName = line;
            console.log("✓ Found First Name:", data.firstName, "at line", i);
          }
          break;
        }
      }
    }

    // Find Middle Name (Gitnang Apelyido/Middle Name)
    if (!data.middleName) {
      const middleNameIndex = cleanLines.findIndex(line => 
        /Gitnang/i.test(line) || (/Middle\s*Name/i.test(line) && !/Date/i.test(line))
      );
      
      if (middleNameIndex !== -1) {
        console.log("Found 'Middle Name' label at index:", middleNameIndex, "=>", cleanLines[middleNameIndex]);
        
        // Check next 5 lines
        for (let i = middleNameIndex + 1; i <= middleNameIndex + 5 && i < cleanLines.length; i++) {
          const line = cleanLines[i];
          console.log(`Checking line ${i}:`, line);
          
          if (/^[A-Z][A-Z\s]{1,25}$/.test(line) && 
              !/REPUBLIKA|REPUBLIC|PHILIPPINE|PAMBANSANG|CARD|IDENTIFICATION|APELYIDO|LAST|PANGALAN|GIVEN|PETSA|DATE|BIRTH|TIRAHAN|ADDRESS|PUROK|NAREGTA|LANAT|SAN|MANUEL|TARLAC|BARANGAY|BRGY/i.test(line)) {
            data.middleName = line;
            console.log("✓ Found Middle Name:", data.middleName, "at line", i);
            break;
          }
        }
      }
    }

    // Find Date of Birth (Petsa ng Kapanganakan/Date of Birth)
    const dobIndex = cleanLines.findIndex(line => 
      /Petsa/i.test(line) || /Date\s*of\s*Birth/i.test(line) || /Kapanganakan/i.test(line)
    );
    
    if (dobIndex !== -1) {
      console.log("Found 'Date of Birth' label at index:", dobIndex, "=>", cleanLines[dobIndex]);
      
      // Check next 5 lines for date
      for (let i = dobIndex + 1; i <= dobIndex + 5 && i < cleanLines.length; i++) {
        const line = cleanLines[i];
        console.log(`Checking line ${i}:`, line);
        
        // Look for date pattern: MONTH DD, YYYY or MONTH DD YYYY
        const dateMatch = line.match(/([A-Z]{3,9})\s+([0-9]{1,2})[,\s]+([0-9]{4})/i);
        if (dateMatch) {
          const [, month, day, year] = dateMatch;
          const dateObj = new Date(`${month} ${day}, ${year}`);
          
          if (!isNaN(dateObj)) {
            data.birthYear = year;
            data.birthMonth = dateObj.toLocaleString('default', { month: 'long' });
            data.birthDay = day;
            console.log("✓ Found Date:", month, day, year, "at line", i);
            break;
          }
        }
      }
    }

    // Find Address (Tirahan/Address)
    const addressIndex = cleanLines.findIndex(line => 
      /Tirahan/i.test(line) || (/Address/i.test(line) && !/Apelyido|Middle/i.test(line))
    );
    
    if (addressIndex !== -1) {
      console.log("Found 'Address' label at index:", addressIndex, "=>", cleanLines[addressIndex]);
      
      // Check next 5 lines
      for (let i = addressIndex + 1; i <= addressIndex + 5 && i < cleanLines.length; i++) {
        const line = cleanLines[i];
        console.log(`Checking line ${i}:`, line);
        
        // Address should be longer and may contain common address words
        // Accept lines with PUROK, BARANGAY, etc. for address field
        if (line.length > 10 && 
            !/REPUBLIKA|REPUBLIC|PHILIPPINE|PAMBANSANG|CARD|IDENTIFICATION|VALID|PETSA|PHL/i.test(line)) {
          data.address = line.slice(0, 200);
          console.log("✓ Found Address:", data.address, "at line", i);
          break;
        }
      }
    }

    // === STRATEGY 2: FALLBACK - Only use if names are still empty ===
    if (!data.lastName || !data.firstName) {
      console.log("=== USING FALLBACK (names not found via labels) ===");
      
      const potentialNameLines = cleanLines.filter((line, idx) => {
        // Must be all uppercase letters/spaces
        if (!/^[A-Z][A-Z\s]+$/.test(line)) return false;
        // Length constraints
        if (line.length < 3 || line.length > 35) return false;
        // Exclude labels and headers
        if (/REPUBLIKA|PHILIPPINES|REPUBLIC|PAMBANSANG|PAGKAKAKILANLAN|PHILIPPINE|IDENTIFICATION|CARD|APELYIDO|PANGALAN|GITNANG|PETSA|KAPANGANAKAN|TIRAHAN|LAST|FIRST|MIDDLE|GIVEN|BIRTH|DATE|ADDRESS|VALID|NAME/i.test(line)) return false;
        // CRITICAL: Exclude ALL address-related keywords
        if (/PUROK|NAREGTA|LANAT|BARANGAY|BRGY|CITY|PROVINCE|STREET|ROAD|AVENUE|SAN|MANUEL|TARLAC|MANILA|QUEZON/i.test(line)) {
          console.log("❌ Excluding address keyword:", line);
          return false;
        }
        
        return true;
      });
      
      console.log("Potential name lines (after filtering):", potentialNameLines);
      
      // First is likely last name
      if (!data.lastName && potentialNameLines[0]) {
        data.lastName = potentialNameLines[0];
        console.log("Fallback Last Name:", data.lastName);
      }
      
      // Second is likely first name (might have middle initial)
      if (!data.firstName && potentialNameLines[1]) {
        const parts = potentialNameLines[1].split(/\s+/);
        const midInitIdx = parts.findIndex(p => /^[A-Z]\.?$/.test(p));
        
        if (midInitIdx !== -1 && midInitIdx > 0) {
          data.firstName = parts.slice(0, midInitIdx).join(' ');
          if (!data.middleName) {
            data.middleName = parts[midInitIdx].replace('.', '');
          }
        } else {
          data.firstName = potentialNameLines[1];
        }
        console.log("Fallback First Name:", data.firstName);
      }
      
      // Third is likely middle name (if not already found)
      if (!data.middleName && potentialNameLines[2]) {
        data.middleName = potentialNameLines[2];
        console.log("Fallback Middle Name:", data.middleName);
      }
    }

    console.log("=== FINAL EXTRACTED DATA ===");
    console.log(data);

    return data;
  };

  // ==================== DRIVER'S LICENSE PARSER ====================
  const parseDriversLicense = (text, lines) => {
    console.log("=== USING DRIVER'S LICENSE PARSER ===");
    
    const data = {
      idNumber: "",
      firstName: "",
      lastName: "",
      middleName: "",
      birthYear: "",
      birthMonth: "",
      birthDay: "",
      address: ""
    };

    // License number format: X##-##-######
    const licensePattern = /\b([A-Z][0-9]{2}[-\s]?[0-9]{2}[-\s]?[0-9]{6})\b/;
    const match = text.match(licensePattern);
    if (match) {
      data.idNumber = match[1].replace(/\s+/g, '');
      console.log("Found License No:", data.idNumber);
    }

    // Driver's license format: LAST NAME, FIRST NAME MIDDLE INITIAL
    const nameMatch = text.match(/([A-Z\s]+),\s*([A-Z\s]+?)(?:\s+([A-Z])\.?)?(?:\n|$)/);
    if (nameMatch) {
      data.lastName = nameMatch[1].trim();
      data.firstName = nameMatch[2].trim();
      if (nameMatch[3]) data.middleName = nameMatch[3];
      console.log("Found names:", data.lastName, data.firstName, data.middleName);
    }

    // Date format in license: MM-DD-YYYY or MM/DD/YYYY
    const dateMatch = text.match(/([0-9]{2})[-/]([0-9]{2})[-/]([0-9]{4})/);
    if (dateMatch) {
      const [, month, day, year] = dateMatch;
      const dateObj = new Date(`${year}-${month}-${day}`);
      if (!isNaN(dateObj)) {
        data.birthYear = year;
        data.birthMonth = dateObj.toLocaleString('default', { month: 'long' });
        data.birthDay = day;
        console.log("Found date:", data.birthYear, data.birthMonth, data.birthDay);
      }
    }

    // Address extraction
    const addressMatch = text.match(/(?:ADDRESS|ADD)[:\s]*(.+?)(?=\n(?:DATE|BIRTH|EXPIRY|$))/is);
    if (addressMatch) {
      data.address = addressMatch[1].trim().slice(0, 200);
      console.log("Found address:", data.address);
    }

    console.log("=== DRIVER'S LICENSE FINAL DATA ===", data);
    return data;
  };

  // ==================== PASSPORT PARSER ====================
  const parsePassport = (text, lines) => {
    console.log("=== USING PASSPORT PARSER ===");
    console.log("All lines:", lines);
    
    const data = {
      idNumber: "",
      firstName: "",
      lastName: "",
      middleName: "",
      birthYear: "",
      birthMonth: "",
      birthDay: "",
      address: ""
    };

    // Helper function to detect garbled OCR text
    const isGarbageText = (line) => {
      if (!line || line.trim().length === 0) return true;
      
      // IMMEDIATELY reject if it contains the exact garbage string
      if (/SRNR\s+SRE\s+nT\s+ERATE\s+Se/i.test(line)) {
        console.log("❌ EXACT MATCH: Detected known garbage string:", line);
        return true;
      }
      
      // Check for known garbage patterns - specific to this OCR issue
      const garbagePatterns = [
        /SRNR/i,
        /ERATE/i,
        /\bnT\b/,
        /\bHEL\b/i,
        /\bTES\b/i,
        /TEREST/i,
      ];
      
      // If multiple garbage patterns match, reject it
      const matchCount = garbagePatterns.filter(pattern => pattern.test(line)).length;
      if (matchCount >= 2) {
        console.log("❌ Detected garbage text (multiple known patterns):", line, "- matched", matchCount, "patterns");
        return true;
      }
      
      // Check for unusual characteristics of garbled text
      const words = line.split(/\s+/);
      
      // Too many very short words (1-3 chars) that aren't common name parts
      const veryShortWords = words.filter(w => w.length <= 3 && !/^(DE|LA|SAN|VAN|DA|DI|LE|MC|II|III|IV|JR|SR|DEL|MAC|VON)$/i.test(w));
      if (veryShortWords.length >= 3) {
        console.log("❌ Detected garbage text (too many very short words):", line, "- short words:", veryShortWords);
        return true;
      }
      
      // Mix of lowercase and uppercase in weird patterns (like "nT")
      if (/[a-z][A-Z]/.test(line)) {
        console.log("❌ Detected garbage text (mixed case pattern):", line);
        return true;
      }
      
      // Check if line has too many "words" for a typical name (more than 6)
      if (words.length > 6) {
        console.log("❌ Too many words for a name:", line, "- word count:", words.length);
        return true;
      }
      
      return false;
    };

    // Helper function to check if a word is a valid name
    const isValidNameWord = (word) => {
      if (!word || word.length < 2) return false;
      
      // Known garbage words and OCR artifacts to reject
      const garbageWords = ['HEL', 'TES', 'TEREST', 'SRNR', 'SRE', 'ERATE', 'nT', 'Se', 'SERINE', 'TERT', 'RNR', 'RIAL'];
      if (garbageWords.some(garbage => word.toUpperCase() === garbage || word.toUpperCase().includes(garbage))) {
        console.log(`  -> "${word}" rejected - matches garbage pattern`);
        return false;
      }
      
      // Must be mostly letters
      const letterCount = (word.match(/[A-Za-z]/g) || []).length;
      const ratio = letterCount / word.length;
      if (ratio < 0.8) {
        console.log(`  -> "${word}" rejected - too few letters (${ratio})`);
        return false;
      }
      
      // Reject words with weird patterns
      if (/[a-z][A-Z]/.test(word)) {
        console.log(`  -> "${word}" rejected - mixed case pattern`);
        return false;
      }
      if (/^[^A-Za-z]/.test(word)) {
        console.log(`  -> "${word}" rejected - starts with non-letter`);
        return false;
      }
      
      // Valid name prefixes are OK even if short
      if (/^(DE|LA|SAN|VAN|DA|DI|LE|MC|DEL|MAC|VON)$/i.test(word)) return true;
      
      // Reject words that look like OCR artifacts (repeated similar letters)
      if (/^(.)\1{3,}$/i.test(word)) {
        console.log(`  -> "${word}" rejected - repeated letters`);
        return false;
      }
      
      // Otherwise, prefer longer words for surname (at least 5 chars for better accuracy)
      const isLongEnough = word.length >= 5;
      if (!isLongEnough) {
        console.log(`  -> "${word}" rejected - too short (${word.length} chars)`);
      }
      return isLongEnough;
    };

    // Helper function to extract the most valid name from a line with mixed garbage
    const extractValidName = (line) => {
      if (!line) return '';
      
      const words = line.split(/\s+/).filter(w => w.length > 0);
      console.log("Extracting valid name from words:", words);
      
      // Filter to only valid name words
      const validWords = words.filter(word => {
        const valid = isValidNameWord(word);
        console.log(`  -> Word "${word}": ${valid ? 'VALID' : 'INVALID'}`);
        return valid;
      });
      
      console.log("Valid words after filtering:", validWords);
      
      // If we have valid words, use the longest one (typically the actual name)
      if (validWords.length > 0) {
        // Sort by length descending and take the longest
        const sortedByLength = [...validWords].sort((a, b) => b.length - a.length);
        console.log("Valid words sorted by length:", sortedByLength);
        const selectedName = sortedByLength[0].toUpperCase();
        console.log("Selected name:", selectedName);
        return selectedName;
      }
      
      console.log("No valid name found, returning empty");
      return '';
    };

    // Clean and normalize lines
    const cleanLines = lines.map(l => l.replace(/\s+/g, ' ').trim());

    // === EXTRACT PASSPORT NUMBER ===
    console.log("=== SEARCHING FOR PASSPORT NUMBER ===");
    
    // First, try to find passport number near "PASSPORT" or "P PHL" keywords
    const passportSection = text.match(/(?:PASSPORT|P\s+PHL)[^\n]*?([P]?[0-9A-Z\s]{8,15})/i);
    if (passportSection) {
      console.log("Found passport section:", passportSection[0]);
      const candidate = passportSection[1].replace(/\s+/g, ''); // Remove all spaces
      console.log("Candidate after removing spaces:", candidate);
      
      // Check if it matches passport format: P + 6-8 digits + optional letter
      if (/^[P]?[0-9]{6,8}[A-Z]?$/i.test(candidate)) {
        const digitCount = (candidate.match(/\d/g) || []).length;
        if (digitCount >= 6 && digitCount <= 9) {
          data.idNumber = candidate.toUpperCase();
          console.log("✓ Found Passport No (from passport section):", data.idNumber);
        }
      }
    }
    
    // If not found, try multiple patterns
    if (!data.idNumber) {
      const passportPatterns = [
        /\b([P][0-9]{6,8}[A-Z])\b/i,              // P1234567A (no spaces)
        /([P][\s]?[0-9][\s]?[0-9]{5,7}[A-Z]?)/i,  // P 6 910277C (with spaces)
        /\b([0-9]{7,9}[A-Z])\b/,                   // 1234567A
        /Passport\s*No[.:\s]*([A-Z0-9\s]{7,15})/i, // After "Passport No"
        /No[.:\s]*([P0-9A-Z\s]{7,15})/i,          // After "No"
      ];

      for (const pattern of passportPatterns) {
        const matches = text.match(pattern);
        if (matches && matches[1]) {
          const potentialNumber = matches[1].replace(/\s+/g, ''); // Remove spaces
          console.log("Trying pattern:", pattern, "=> Found:", potentialNumber);
          
          // Verify it has at least 6 digits and isn't a date
          const digitCount = (potentialNumber.match(/\d/g) || []).length;
          const hasValidFormat = digitCount >= 6 && digitCount <= 10;
          const notDate = !/^[0-3][0-9][0-1][0-9]/.test(potentialNumber);
          const notAllSameDigit = !/^(.)\1+$/.test(potentialNumber);
          
          if (hasValidFormat && notDate && notAllSameDigit) {
            data.idNumber = potentialNumber.toUpperCase();
            console.log("✓ Found Passport No:", data.idNumber);
            break;
          } else {
            console.log("  -> Rejected:", { digitCount, hasValidFormat, notDate, notAllSameDigit });
          }
        }
      }
    }

    // === STRATEGY 1: MRZ line extraction (Machine Readable Zone) - MOST ACCURATE ===
    console.log("=== STRATEGY 1: Trying MRZ extraction (most reliable) ===");
    const mrzMatch = text.match(/P[<]?PHL([A-Z]+)[<]+([A-Z<]+)/);
    if (mrzMatch) {
      console.log("Found MRZ pattern:", mrzMatch[0]);
      data.lastName = mrzMatch[1].replace(/<+/g, '').trim();
      console.log("✓ MRZ Last Name:", data.lastName);
      
      const givenParts = mrzMatch[2].replace(/</g, ' ').trim().split(/\s+/).filter(p => p.length > 0);
      if (givenParts.length > 0) {
        data.firstName = givenParts[0];
        console.log("✓ MRZ First Name:", data.firstName);
        if (givenParts.length > 1) {
          data.middleName = givenParts.slice(1).join(' ');
          console.log("✓ MRZ Middle Name:", data.middleName);
        }
      }
    }

    // === STRATEGY 2: Look for specific field labels (only if MRZ failed) ===
    
    // Find Surname/Last Name
    if (!data.lastName) {
      console.log("=== STRATEGY 2: Looking for Surname field ===");
      const surnameIndex = cleanLines.findIndex(line => 
        /^(Surname|Last\s*Name|Apelyido)[:\s]*$/i.test(line) || 
        /(Surname|Last\s*Name|Apelyido)[:\s]/i.test(line)
      );
      
      if (surnameIndex !== -1) {
        console.log("Found 'Surname' label at index:", surnameIndex, "=>", cleanLines[surnameIndex]);
        
        // Check if surname is on the same line
        const sameLine = cleanLines[surnameIndex].replace(/^.*(Surname|Last\s*Name|Apelyido)[:\s]*/i, '').trim();
        if (sameLine && sameLine.length > 0) {
          console.log("Same line candidate:", sameLine);
          
          // Try to extract valid name even if line has garbage
          const validName = extractValidName(sameLine);
          if (validName && validName.length >= 5) {
            data.lastName = validName;
            console.log("✓ Found Last Name (same line, extracted):", data.lastName);
          } else if (!isGarbageText(sameLine) && /^[A-Z][A-Z\s-]{1,30}$/i.test(sameLine)) {
            data.lastName = sameLine.toUpperCase();
            console.log("✓ Found Last Name (same line, full):", data.lastName);
          }
        }
        
        // If not found on same line, check next 5 lines
        if (!data.lastName) {
          for (let i = surnameIndex + 1; i <= surnameIndex + 5 && i < cleanLines.length; i++) {
            const line = cleanLines[i];
            console.log(`Checking line ${i}:`, line);
            
            // Try to extract valid name first
            const validName = extractValidName(line);
            if (validName && validName.length >= 5) {
              data.lastName = validName;
              console.log("✓ Found Last Name (extracted):", data.lastName, "at line", i);
              break;
            }
            
            // If extraction failed, check if whole line is valid
            if (!isGarbageText(line) && 
                /^[A-Z][A-Z\s-]{1,30}$/i.test(line) && 
                !/REPUBLIC|PHILIPPINE|PASSPORT|GIVEN|NAMES|DATE|BIRTH|PLACE|SEX|NATIONALITY|AUTHORITY|ISSUE|EXPIRY|CODE|TYPE|P<PHL|[0-9]{4}|FILIPINO/i.test(line)) {
              data.lastName = line.toUpperCase();
              console.log("✓ Found Last Name (full line):", data.lastName, "at line", i);
              break;
            }
          }
        }
      }
    }

    // Find Given Names/First Name
    if (!data.firstName) {
      console.log("=== Looking for Given Names field ===");
      const givenNameIndex = cleanLines.findIndex(line => 
        /^(Given\s*Names?|First\s*Name|Mga\s*Pangalan)[:\s]*$/i.test(line) ||
        /(Given\s*Names?|First\s*Name|Mga\s*Pangalan)[:\s]/i.test(line)
      );
      
      if (givenNameIndex !== -1) {
        console.log("Found 'Given Names' label at index:", givenNameIndex, "=>", cleanLines[givenNameIndex]);
        
        // Check if name is on the same line
        const sameLine = cleanLines[givenNameIndex].replace(/^.*(Given\s*Names?|First\s*Name|Mga\s*Pangalan)[:\s]*/i, '').trim();
        if (sameLine && sameLine.length > 0) {
          console.log("Same line candidate for given names:", sameLine);
          
          // Try to extract valid name(s) even if line has garbage
          const validName = extractValidName(sameLine);
          if (validName && validName.length >= 2) {
            const nameParts = validName.split(/\s+/);
            data.firstName = nameParts[0].toUpperCase();
            if (nameParts.length > 1 && !data.middleName) {
              data.middleName = nameParts.slice(1).join(' ').toUpperCase();
            }
            console.log("✓ Found First Name (same line, extracted):", data.firstName, "Middle:", data.middleName || "none");
          } else if (!isGarbageText(sameLine) && /^[A-Z][A-Z\s-]{1,40}$/i.test(sameLine)) {
            // Check if line contains middle name too
            const nameParts = sameLine.split(/\s+/);
            if (nameParts.length > 1 && !data.middleName) {
              data.firstName = nameParts[0].toUpperCase();
              data.middleName = nameParts.slice(1).join(' ').toUpperCase();
              console.log("✓ Found First & Middle Name (same line, full):", data.firstName, data.middleName);
            } else {
              data.firstName = sameLine.toUpperCase();
              console.log("✓ Found First Name (same line, full):", data.firstName);
            }
          }
        }
        
        // If not found on same line, check next 5 lines
        if (!data.firstName) {
          for (let i = givenNameIndex + 1; i <= givenNameIndex + 5 && i < cleanLines.length; i++) {
            const line = cleanLines[i];
            console.log(`Checking line ${i} for given names:`, line);
            
            // Try to extract valid name first
            const validName = extractValidName(line);
            if (validName && validName.length >= 2) {
              const nameParts = validName.split(/\s+/);
              data.firstName = nameParts[0].toUpperCase();
              if (nameParts.length > 1 && !data.middleName) {
                data.middleName = nameParts.slice(1).join(' ').toUpperCase();
              }
              console.log("✓ Found First Name (extracted):", data.firstName, "Middle:", data.middleName || "none", "at line", i);
              break;
            }
            
            // If extraction failed, check if whole line is valid
            if (!isGarbageText(line) &&
                /^[A-Z][A-Z\s-]{1,40}$/i.test(line) && 
                !/REPUBLIC|PHILIPPINE|PASSPORT|SURNAME|LAST|DATE|BIRTH|PLACE|SEX|NATIONALITY|AUTHORITY|ISSUE|EXPIRY|CODE|TYPE|P<PHL|[0-9]{4}|FILIPINO/i.test(line)) {
              
              // Split into first and middle names
              const nameParts = line.split(/\s+/);
              data.firstName = nameParts[0].toUpperCase();
              if (nameParts.length > 1 && !data.middleName) {
                data.middleName = nameParts.slice(1).join(' ').toUpperCase();
              }
              console.log("✓ Found First Name (full line):", data.firstName, "Middle:", data.middleName || "none", "at line", i);
              break;
            }
          }
        }
      }
    }

    // === STRATEGY 3: FALLBACK - Look for uppercase name patterns ===
    if (!data.lastName || !data.firstName) {
      console.log("=== USING FALLBACK for names ===");
      console.log("Current lastName:", data.lastName);
      console.log("Current firstName:", data.firstName);
      
      const potentialNameLines = cleanLines.filter(line => {
        console.log("FALLBACK: Evaluating line:", line);
        
        // FIRST: Check garbage before anything else
        if (isGarbageText(line)) {
          console.log("  -> REJECTED by isGarbageText");
          return false;
        }
        
        // Try to extract valid name from line
        const validName = extractValidName(line);
        if (!validName || validName.length < 3) {
          console.log("  -> REJECTED - no valid name found in line");
          return false;
        }
        
        // Must be uppercase letters, spaces, hyphens only
        if (!/^[A-Z][A-Z\s-]{1,35}$/i.test(line)) {
          console.log("  -> REJECTED by uppercase regex");
          return false;
        }
        
        // Exclude labels, headers
        if (/REPUBLIC|PHILIPPINES|PHILIPPINE|PASSPORT|SURNAME|GIVEN|NAMES|LAST|FIRST|DATE|BIRTH|PLACE|SEX|MALE|FEMALE|NATIONALITY|FILIPINO|AUTHORITY|ISSUE|EXPIRY|VALID|CODE|TYPE|NUMBER|P<PHL/i.test(line)) {
          console.log("  -> REJECTED by keyword filter");
          return false;
        }
        
        // Exclude lines with many numbers
        if (/[0-9]{3,}/.test(line)) {
          console.log("  -> REJECTED by number filter");
          return false;
        }
        
        console.log("  -> ✓ ACCEPTED");
        return true;
      });
      
      console.log("Potential name lines (after ALL filtering):", potentialNameLines);
      
      // First clean uppercase line is likely surname
      if (!data.lastName && potentialNameLines[0]) {
        console.log("Attempting to set fallback lastName from:", potentialNameLines[0]);
        const extracted = extractValidName(potentialNameLines[0]);
        if (extracted && extracted.length >= 3) {
          data.lastName = extracted;
          console.log("✓ Fallback Last Name SET:", data.lastName);
        }
      }
      
      // Second clean uppercase line is likely given names
      if (!data.firstName && potentialNameLines[1]) {
        console.log("Attempting to set fallback firstName from:", potentialNameLines[1]);
        const extracted = extractValidName(potentialNameLines[1]);
        if (extracted && extracted.length >= 2) {
          // Check if it's a compound name (e.g., "MARIA CLARA")
          const nameParts = extracted.split(/\s+/);
          data.firstName = nameParts[0].toUpperCase();
          if (nameParts.length > 1 && !data.middleName) {
            data.middleName = nameParts.slice(1).join(' ').toUpperCase();
          }
          console.log("✓ Fallback First Name SET:", data.firstName, "Middle:", data.middleName || "none");
        }
      }
    }

    // === DATE OF BIRTH EXTRACTION ===
    console.log("=== SEARCHING FOR DATE OF BIRTH ===");
    
    // Find Date of Birth field
    const dobIndex = cleanLines.findIndex(line => 
      /^(Date\s*of\s*Birth|Birth\s*Date|Petsa\s*ng\s*Kapanganakan)[:\s]*$/i.test(line) ||
      /(Date\s*of\s*Birth|Birth\s*Date|Petsa)[:\s]/i.test(line)
    );
    
    if (dobIndex !== -1) {
      console.log("Found 'Date of Birth' label at index:", dobIndex, "=>", cleanLines[dobIndex]);
      
      // Check if date is on the same line
      const sameLine = cleanLines[dobIndex].replace(/^.*(Date\s*of\s*Birth|Birth\s*Date|Petsa\s*ng\s*Kapanganakan)[:\s]*/i, '').trim();
      
      // Try multiple date formats on same line
      let dateFound = false;
      
      // Format: 01 JAN 1990 or 01JAN1990
      let dateMatch = sameLine.match(/([0-9]{1,2})\s*([A-Z]{3})\s*([0-9]{4})/i);
      if (dateMatch) {
        const [, day, monthAbbr, year] = dateMatch;
        const dateObj = new Date(`${monthAbbr} ${day}, ${year}`);
        if (!isNaN(dateObj)) {
          data.birthYear = year;
          data.birthMonth = dateObj.toLocaleString('default', { month: 'long' });
          data.birthDay = day.padStart(2, '0');
          console.log("✓ Found date (same line):", data.birthDay, data.birthMonth, data.birthYear);
          dateFound = true;
        }
      }
      
      // If not on same line, check next 5 lines
      if (!dateFound) {
        for (let i = dobIndex + 1; i <= dobIndex + 5 && i < cleanLines.length; i++) {
          const line = cleanLines[i];
          console.log(`Checking line ${i} for date:`, line);
          
          // Pattern: 01 JAN 1990 or 01JAN1990 or 01-JAN-1990
          dateMatch = line.match(/([0-9]{1,2})[\s-]*([A-Z]{3})[\s-]*([0-9]{4})/i);
          if (dateMatch) {
            const [, day, monthAbbr, year] = dateMatch;
            const dateObj = new Date(`${monthAbbr} ${day}, ${year}`);
            if (!isNaN(dateObj) && parseInt(year) >= 1900 && parseInt(year) <= 2020) {
              data.birthYear = year;
              data.birthMonth = dateObj.toLocaleString('default', { month: 'long' });
              data.birthDay = day.padStart(2, '0');
              console.log("✓ Found date:", data.birthDay, data.birthMonth, data.birthYear, "at line", i);
              dateFound = true;
              break;
            }
          }
        }
      }
    }
    
    // Fallback: search entire text for date pattern
    if (!data.birthYear) {
      console.log("=== Fallback date search in entire text ===");
      const dateMatch = text.match(/([0-9]{2})[\s-]*([A-Z]{3})[\s-]*([0-9]{4})/i);
      if (dateMatch) {
        const [, day, monthAbbr, year] = dateMatch;
        const dateObj = new Date(`${monthAbbr} ${day}, ${year}`);
        if (!isNaN(dateObj) && parseInt(year) >= 1900 && parseInt(year) <= 2020) {
          data.birthYear = year;
          data.birthMonth = dateObj.toLocaleString('default', { month: 'long' });
          data.birthDay = day.padStart(2, '0');
          console.log("Fallback: Found date:", data.birthDay, data.birthMonth, data.birthYear);
        }
      }
    }

    console.log("=== PASSPORT FINAL DATA ===", data);
    return data;
  };

  // ==================== MAIN PARSER WITH ID-TYPE ROUTING ====================
  const parseIDText = (text, idType) => {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    
    console.log("=== PARSER ROUTING ===");
    console.log("ID Type received:", idType);
    console.log("Available lines:", lines.length);

    // Convert to lowercase for comparison
    const idTypeLower = idType ? idType.toLowerCase() : '';

    // Route to specialized parsers based on ID type
    if (idTypeLower.includes("national") || idTypeLower.includes("philid")) {
      console.log("✓ Routing to Philippine National ID Parser");
      return parsePhilippineNationalID(text, lines);
    }
    
    if (idTypeLower.includes("driver") || idTypeLower.includes("license")) {
      console.log("✓ Routing to Driver's License Parser");
      return parseDriversLicense(text, lines);
    }
    
    if (idTypeLower.includes("passport")) {
      console.log("✓ Routing to Passport Parser");
      return parsePassport(text, lines);
    }

    console.log("ℹ️ Using Generic Parser for:", idType);

    // === GENERIC PARSER FOR OTHER ID TYPES ===
    const data = {
      idNumber: "",
      firstName: "",
      lastName: "",
      middleName: "",
      birthYear: "",
      birthMonth: "",
      birthDay: "",
      address: ""
    };

    // === EXTRACT DATE OF BIRTH ===
    const datePatterns = [
      /(?:DATE\s+OF\s+BIRTH|BIRTH\s+DATE|DOB|BIRTHDAY)[:\s]*([0-9]{1,2}[-/.]\s?[0-9]{1,2}[-/.]\s?[0-9]{2,4})/i,
      /(?:DATE\s+OF\s+BIRTH|BIRTH\s+DATE|DOB|BIRTHDAY)[:\s]*([0-9]{1,2}\s+(?:JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)[A-Z]*\s+[0-9]{2,4})/i,
      /(?:DATE\s+OF\s+BIRTH|BIRTH\s+DATE|DOB|BIRTHDAY)[:\s]*([A-Z]+\s+[0-9]{1,2},?\s+[0-9]{4})/i,
      /\b([0-9]{1,2}[-/.]\s?[0-9]{1,2}[-/.]\s?[0-9]{4})\b/,
      /\b([0-9]{2}[-/.][0-9]{2}[-/.][0-9]{2})\b/,
      /\b([0-9]{1,2}\s+(?:JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)[A-Z]*\s+[0-9]{2,4})\b/i
    ];

    for (const pattern of datePatterns) {
      const match = text.match(pattern);
      if (match) {
        const dateStr = match[1] || match[0];
        console.log("Found date string:", dateStr);
        const dateObj = new Date(dateStr.replace(/[/.]/g, '-'));
        
        if (!isNaN(dateObj) && dateObj.getFullYear() > 1900 && dateObj.getFullYear() < 2030) {
          data.birthYear = dateObj.getFullYear().toString();
          data.birthMonth = dateObj.toLocaleString('default', { month: 'long' });
          data.birthDay = dateObj.getDate().toString();
          console.log("Parsed date:", data.birthYear, data.birthMonth, data.birthDay);
          break;
        }
      }
    }

    // === EXTRACT ID NUMBER (MUST CONTAIN AT LEAST ONE DIGIT) ===
    const idPatterns = [
      /(?:ID\s+NO|ID\s+NUMBER|IDENTIFICATION\s+NO|STUDENT\s+NO|LICENSE\s+NO|SSS\s+NO|TIN\s+NO|UMID\s+NO|CRN)[:\s]*([A-Z0-9-]+)/i,
      /\b([A-Z]{1,3}[-\s]?[0-9]{7,12})\b/,
      /\b([0-9]{4}[-\s]?[0-9]{4,7}[-\s]?[0-9]{4,7})\b/,
      /\b([A-Z0-9]{10,20})\b/
    ];

    for (const pattern of idPatterns) {
      const match = text.match(pattern);
      if (match) {
        const idNum = (match[1] || match[0]).replace(/\s+/g, '');
        
        const hasDigit = /\d/.test(idNum);
        const isValidLength = idNum.length >= 8 && idNum.length <= 20;
        const isNotOnlyLetters = !/^[A-Z]+$/.test(idNum);
        
        if (hasDigit && isValidLength && isNotOnlyLetters) {
          data.idNumber = idNum;
          console.log("Found valid ID number:", idNum);
          break;
        }
      }
    }

    // === ENHANCED NAME EXTRACTION ===
    const lastNameMatch = text.match(/(?:LAST\s+NAME|SURNAME|FAMILY\s+NAME)[:\s]*([A-Z][A-Z\s.'-]+?)(?:\n|FIRST|GIVEN|MIDDLE|,|$)/i);
    if (lastNameMatch) {
      data.lastName = lastNameMatch[1].trim();
      console.log("Found last name:", data.lastName);
    }

    const firstNameMatch = text.match(/(?:FIRST\s+NAME|GIVEN\s+NAME)[:\s]*([A-Z][A-Z\s.'-]+?)(?:\n|MIDDLE|LAST|,|$)/i);
    if (firstNameMatch) {
      data.firstName = firstNameMatch[1].trim();
      console.log("Found first name:", data.firstName);
    }

    const middleNameMatch = text.match(/(?:MIDDLE\s+NAME)[:\s]*([A-Z][A-Z\s.'-]+?)(?:\n|$)/i);
    if (middleNameMatch) {
      data.middleName = middleNameMatch[1].trim();
      console.log("Found middle name:", data.middleName);
    }

    if (!data.lastName && !data.firstName) {
      const upperCaseLines = lines.filter(l => 
        /^[A-Z][A-Z\s.,'-]+$/.test(l) && 
        l.length > 5 && 
        l.length < 50 &&
        !/\d/.test(l) &&
        !/REPUBLIC|PHILIPPINES|GOVERNMENT|CARD|LICENSE|IDENTIFICATION|NATIONAL|ISSUED|DATE|BIRTH|ADDRESS/i.test(l)
      );
      
      console.log("Uppercase name lines:", upperCaseLines);
      
      if (upperCaseLines.length > 0) {
        const nameLine = upperCaseLines[0];
        
        if (nameLine.includes(',')) {
          const [lastPart, firstPart] = nameLine.split(',').map(s => s.trim());
          data.lastName = lastPart;
          
          const firstNameParts = firstPart.split(/\s+/);
          const middleInitialIndex = firstNameParts.findIndex(part => /^[A-Z]\.?$/.test(part));
          
          if (middleInitialIndex !== -1) {
            data.firstName = firstNameParts.slice(0, middleInitialIndex).join(' ');
            data.middleName = firstNameParts[middleInitialIndex].replace('.', '');
            console.log("Found name with middle initial:", data.lastName, data.firstName, data.middleName);
          } else {
            data.firstName = firstPart;
            console.log("Found name without middle initial:", data.lastName, data.firstName);
          }
        } else {
          const parts = nameLine.split(/\s+/).filter(p => p.length > 0);
          
          if (parts.length === 2) {
            data.firstName = parts[0];
            data.lastName = parts[1];
            console.log("Found 2-word name:", data.firstName, data.lastName);
          } else if (parts.length === 3) {
            if (/^[A-Z]\.?$/.test(parts[1])) {
              data.firstName = parts[0];
              data.middleName = parts[1].replace('.', '');
              data.lastName = parts[2];
              console.log("Found name with middle initial:", data.firstName, data.middleName, data.lastName);
            } else {
              data.firstName = parts[0];
              data.middleName = parts[1];
              data.lastName = parts[2];
              console.log("Found 3-word name:", data.firstName, data.middleName, data.lastName);
            }
          } else if (parts.length > 3) {
            const middleInitialIndex = parts.findIndex(part => /^[A-Z]\.?$/.test(part));
            
            if (middleInitialIndex !== -1) {
              data.firstName = parts.slice(0, middleInitialIndex).join(' ');
              data.middleName = parts[middleInitialIndex].replace('.', '');
              data.lastName = parts.slice(middleInitialIndex + 1).join(' ');
              console.log("Found multi-word name with middle initial:", data.firstName, data.middleName, data.lastName);
            } else {
              data.lastName = parts[parts.length - 1];
              data.firstName = parts.slice(0, -1).join(' ');
              console.log("Found multi-word name:", data.firstName, data.lastName);
            }
          }
        }
      }
    }

    // === EXTRACT ADDRESS ===
    const addressPatterns = [
      /(?:ADDRESS|RESIDENCE)[:\s]*(.+?)(?=\n(?:DATE|BIRTH|ID|ISSUED|VALID|$))/is,
      /(?:ADDRESS|RESIDENCE)[:\s]*(.+?)$/im
    ];

    for (const pattern of addressPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        data.address = match[1].trim().replace(/\s+/g, ' ').slice(0, 200);
        console.log("Found address:", data.address);
        break;
      }
    }

    if (!data.address) {
      const addressKeywords = ['Street', 'Road', 'Avenue', 'Barangay', 'City', 'Province', 'St.', 'Rd.', 'Ave.', 'Brgy.'];
      const addressLines = lines.filter(l => 
        addressKeywords.some(kw => l.includes(kw)) && l.length > 10
      );
      
      if (addressLines.length > 0) {
        data.address = addressLines.join(', ').slice(0, 200);
        console.log("Found address from keywords:", data.address);
      }
    }

    return data;
  };

  return (
    <div className="bg-gradient-to-b from-green-900 via-green-600 to-yellow-400 min-h-screen flex items-center justify-center px-4 py-8">
      
      {/* HIDDEN CANVAS FOR PROCESSING */}
      <canvas ref={canvasRef} className="hidden"></canvas>

      <div className="w-full max-w-md bg-white shadow-2xl rounded-2xl p-6 sm:p-8">
        {/* Header */}
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-3">Verify your account</h2>

        {/* Progress Indicator */}
        <div className="flex justify-center items-center gap-2 mb-6">
          <div className="h-2 w-12 bg-green-700 rounded-full"></div>
          <div className="h-2 w-12 bg-green-700 rounded-full"></div>
          <div className="h-2 w-12 bg-gray-300 rounded-full"></div>
        </div>

        {/* Selected ID Type */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-gray-600 text-center">Selected ID Type</p>
          <h3 className="text-lg font-semibold text-green-800 text-center">{selectedID}</h3>
        </div>
        
        <p className="text-gray-600 text-xs mb-6 text-center">
          Upload clear photos of both sides of your ID. We'll automatically extract your information. After scanning, you'll be able to review and correct any information that wasn't captured correctly or is missing.
        </p>
        
        {/* Front ID Upload */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Front of ID</label>
          {frontPreview ? (
            <div className="relative w-full">
              <div className="border-2 border-dashed border-green-300 rounded-lg overflow-hidden bg-gray-50">
                <img src={frontPreview} alt="Front Preview" className="w-full h-48 object-contain" />
              </div>
              <button
                type="button"
                onClick={() => handleRemoveFile('front')}
                className="absolute top-3 right-3 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 shadow-lg transition-colors"
                aria-label="Remove front file"
              >
                <X size={18} />
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <button
                onClick={() => document.getElementById("front-upload").click()}
                className="w-full py-3 rounded-lg font-semibold bg-green-700 text-white hover:bg-green-800 transition-colors flex items-center justify-center gap-2"
              >
                <Upload size={20} />
                Upload Front
              </button>
              <button
                onClick={() => document.getElementById("front-scan").click()}
                className="w-full py-3 rounded-lg font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors sm:hidden flex justify-center items-center gap-2"
              >
                <Camera size={20} /> Take Photo
              </button>
              <input
                id="front-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileChange(e, 'front')}
              />
              <input
                id="front-scan"
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => handleFileChange(e, 'front')}
              />
            </div>
          )}
        </div>

        {/* Back ID Upload */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Back of ID</label>
          {backPreview ? (
            <div className="relative w-full">
              <div className="border-2 border-dashed border-green-300 rounded-lg overflow-hidden bg-gray-50">
                <img src={backPreview} alt="Back Preview" className="w-full h-48 object-contain" />
              </div>
              <button
                type="button"
                onClick={() => handleRemoveFile('back')}
                className="absolute top-3 right-3 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 shadow-lg transition-colors"
                aria-label="Remove back file"
              >
                <X size={18} />
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <button
                onClick={() => document.getElementById("back-upload").click()}
                className="w-full py-3 rounded-lg font-semibold bg-green-700 text-white hover:bg-green-800 transition-colors flex items-center justify-center gap-2"
              >
                <Upload size={20} />
                Upload Back
              </button>
              <button
                onClick={() => document.getElementById("back-scan").click()}
                className="w-full py-3 rounded-lg font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors sm:hidden flex justify-center items-center gap-2"
              >
                <Camera size={20} /> Take Photo
              </button>
              <input
                id="back-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileChange(e, 'back')}
              />
              <input
                id="back-scan"
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => handleFileChange(e, 'back')}
              />
            </div>
          )}
        </div>

        {/* Debug: Show extracted text */}
        {extractedText && (
          <details open className="mb-4 p-3 bg-yellow-50 rounded-lg border-2 border-yellow-400 text-xs">
            <summary className="font-bold text-yellow-800 cursor-pointer mb-2">
              ⚠️ OCR Debug Info - Check if names look correct
            </summary>
            <div className="space-y-2">
              <div className="p-2 bg-white rounded border">
                <p className="font-semibold text-gray-700">Raw Scanned Text:</p>
                <pre className="whitespace-pre-wrap text-gray-600 max-h-32 overflow-y-auto mt-1 text-xs">
                  {extractedText}
                </pre>
              </div>
              <div className="text-xs text-yellow-700 mt-2">
                💡 <strong>Tip:</strong> Open browser console (F12) to see detailed extraction logs
              </div>
            </div>
          </details>
        )}

        {/* Navigation Buttons */}
        <div className="flex gap-3 mt-4">
          <button
            type="button"
            onClick={() => navigate("/verify-id")}
            disabled={isScanning}
            className="flex-1 py-3 rounded-lg font-medium border-2 border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            Back
          </button>
          
          <button
            type="submit"
            onClick={handleScanAndNext}
            disabled={!frontFile || !backFile || isScanning}
            className={`flex-1 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all ${
              frontFile && backFile && !isScanning
                ? "bg-green-700 text-white hover:bg-green-800 shadow-lg"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            {isScanning ? (
              <>
                <Loader2 className="animate-spin h-5 w-5" />
                <span className="text-sm">{scanStatus || "Scanning..."}</span>
              </>
            ) : (
              <>
                <ScanLine className="h-5 w-5" />
                Scan & Next
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}