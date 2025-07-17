from google.cloud import texttospeech
import tempfile
### 
def text_to_speech(
    text,
    lang='ko-KR',
    gender='FEMALE',
    speaking_rate=1.1,
    pitch=0.0,
    voice_name='ko-KR-Chirp3-HD-Leda'
):
    client = texttospeech.TextToSpeechClient()

    if voice_name:
        voice = texttospeech.VoiceSelectionParams(
            language_code=lang,
            name=voice_name
        )
    else:
        voice = texttospeech.VoiceSelectionParams(
            language_code=lang,
            ssml_gender=getattr(texttospeech.SsmlVoiceGender, gender)
        )

    audio_config = texttospeech.AudioConfig(
        audio_encoding=texttospeech.AudioEncoding.MP3,
        speaking_rate=speaking_rate,
        pitch=pitch
    )

    synthesis_input = texttospeech.SynthesisInput(text=text)
    response = client.synthesize_speech(
        input=synthesis_input,
        voice=voice,
        audio_config=audio_config
    )

    with tempfile.NamedTemporaryFile(delete=False, suffix='.mp3') as out:
        out.write(response.audio_content)
        return out.name

def list_voices(lang='ko-KR'):
    client = texttospeech.TextToSpeechClient()
    voices = client.list_voices(language_code=lang)
    for v in voices.voices:
        print(f"Name: {v.name}, Gender: {texttospeech.SsmlVoiceGender(v.ssml_gender).name}, SampleRate: {v.natural_sample_rate_hertz}Hz, Supported languages: {v.language_codes}") 