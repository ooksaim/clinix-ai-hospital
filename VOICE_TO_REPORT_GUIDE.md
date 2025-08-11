# Voice-to-Radiology Report Setup Guide

## Overview
The Rapid Report Generation feature allows radiologists to dictate their findings using voice, which are then automatically transcribed and formatted into professional radiology reports using AI.

## Technical Architecture

### 1. Voice Recording
- **Browser API**: Uses `navigator.mediaDevices.getUserMedia()` to capture audio
- **Format**: WebM audio with Opus codec for optimal compression
- **Real-time**: Shows recording timer and waveform visualization

### 2. Speech-to-Text (Whisper API)
- **Service**: OpenAI Whisper API (`whisper-1` model)
- **Endpoint**: `/api/transcribe`
- **Features**: 
  - Medical terminology recognition
  - English language optimization
  - Context-aware transcription for radiology

### 3. Report Generation (GPT-4)
- **Service**: OpenAI GPT-4o-mini (optimized for medical tasks)
- **Endpoint**: `/api/generate-report`
- **Features**:
  - Professional medical formatting
  - Standardized report structure
  - Study-type specific templates

## Setup Instructions

### 1. Environment Configuration
```bash
# Copy the example environment file
cp .env.example .env.local

# Add your OpenAI API key
OPENAI_API_KEY=sk-your-actual-api-key-here
```

### 2. OpenAI API Key Setup
1. Visit [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create a new API key
3. Add billing information (required for Whisper and GPT-4 APIs)
4. Set usage limits to control costs

### 3. Browser Permissions
- **Microphone Access**: Users must grant microphone permissions
- **HTTPS Required**: Voice recording only works on HTTPS (or localhost)
- **Supported Browsers**: Chrome, Firefox, Safari, Edge (modern versions)

## API Endpoints

### `/api/transcribe` (POST)
Converts audio to text using OpenAI Whisper.

**Request:**
- `audio`: Audio file (WebM format)

**Response:**
```json
{
  "transcript": "Patient presented for CT chest examination..."
}
```

### `/api/generate-report` (POST)
Generates professional radiology report from transcript.

**Request:**
```json
{
  "transcript": "Voice transcription text...",
  "patientInfo": {
    "patientName": "John Doe",
    "patientId": "12345",
    "studyType": "CT Chest",
    // ... other fields
  }
}
```

**Response:**
```json
{
  "report": {
    "id": "RPT-123456789",
    "examination": "CT chest examination...",
    "findings": "The lungs show...",
    "impression": "Normal chest CT...",
    "recommendations": "Routine follow-up...",
    // ... other fields
  }
}
```

## Supported Study Types

- **CT Scans**: Chest, Abdomen, Brain, etc.
- **MRI**: Brain, Spine, Joint imaging
- **X-Ray**: Chest, Extremities, Spine
- **Ultrasound**: Abdominal, Pelvic, Vascular

## Report Structure

Each generated report includes:

1. **Patient Details**: Name, ID, DOB, Study info
2. **Examination**: Description of study performed
3. **Findings**: Detailed observations from imaging
4. **Impression**: Clinical interpretation and diagnosis
5. **Recommendations**: Follow-up care suggestions

## Cost Considerations

### OpenAI API Pricing (as of 2024):
- **Whisper API**: ~$0.006 per minute of audio
- **GPT-4o-mini**: ~$0.15 per 1K input tokens, ~$0.60 per 1K output tokens

### Estimated Costs:
- **Per Report**: $0.05 - $0.20 (depending on audio length and report complexity)
- **100 Reports/month**: ~$5 - $20
- **1000 Reports/month**: ~$50 - $200

## Security & Compliance

### Data Handling
- **Audio Files**: Processed in memory, not stored permanently
- **Transcripts**: Can be stored locally or in secure database
- **Patient Data**: Follows HIPAA guidelines (ensure proper encryption)

### Privacy
- **OpenAI Policy**: Audio and text sent to OpenAI for processing
- **Data Retention**: OpenAI doesn't use API data for model training
- **Compliance**: Review OpenAI's BAA (Business Associate Agreement) for healthcare use

## Troubleshooting

### Common Issues

1. **Microphone Not Working**
   - Check browser permissions
   - Ensure HTTPS connection
   - Test with different browser

2. **Transcription Errors**
   - Speak clearly and slowly
   - Use medical terminology precisely
   - Minimize background noise

3. **API Errors**
   - Check API key validity
   - Verify billing setup
   - Monitor rate limits

4. **Poor Report Quality**
   - Provide clear, structured dictation
   - Include all required sections
   - Use consistent medical terminology

### Performance Tips

1. **For Better Transcription**:
   - Use a quality microphone
   - Record in quiet environment
   - Speak medical terms clearly
   - Pause between sections

2. **For Better Reports**:
   - Follow standard dictation format
   - Include patient context
   - Be specific about findings
   - State impression clearly

## Future Enhancements

### Planned Features
- [ ] Custom report templates per radiologist
- [ ] Integration with DICOM viewers
- [ ] Multi-language support
- [ ] Voice command navigation
- [ ] Automated quality scoring
- [ ] Integration with hospital EMR systems

### Advanced AI Features
- [ ] Fine-tuned models for specific radiology subspecialties
- [ ] Image analysis integration
- [ ] Automated measurement extraction
- [ ] Cross-reference with prior studies
- [ ] AI-powered differential diagnosis suggestions

## Support

For technical support or feature requests, please contact the development team or create an issue in the project repository.
