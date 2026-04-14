import { Keyboard, TouchableWithoutFeedback, Animated, View, Text, Button, StyleSheet, TextInput, ScrollView, TouchableOpacity  } from 'react-native';
import { useState, useRef, useEffect } from 'react';
import * as Speech from 'expo-speech';
import { Picker } from '@react-native-picker/picker';
import { KeyboardAvoidingView, Platform } from 'react-native';
import { Audio } from 'expo-av';
import * as DocumentPicker from 'expo-document-picker';
import { MaterialIcons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';






export default function HomeScreen() {
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [seconds, setSeconds] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [message, setMessage] = useState<string>('');
  const [running, setRunning] = useState<boolean>(false);


  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [audioURI, setAudioURI] = useState<string | null>(null);
  const [confirmingRedo, setConfirmingRedo] = useState(false);
  const recordingOptions: Audio.RecordingOptions = {
  android: {
    extension: '.m4a',
    outputFormat: 2,
    audioEncoder: 3,
    sampleRate: 44100,
    numberOfChannels: 1,
    bitRate: 192000,
  },
  ios: {
    extension: '.m4a',
    audioQuality: 2,
    sampleRate: 44100,
    numberOfChannels: 2,
    bitRate: 192000,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
  web: {
    mimeType: 'audio/webm', // can also be 'audio/wav' depending on needs
    bitsPerSecond: 192000,
  },
};
useEffect(() => {
  (async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') console.log('Notification permission not granted!');
  })();
}, []);
  async function scheduleNotification(delaySeconds: number) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '⏰ Timer Finished',
      body: message || 'Your timer is done!',
      sound: 'default',
    },
    trigger: {
      type: 'timeInterval',
      seconds: delaySeconds,
      repeats: false,
    } as any,
  });
}

  const hoursArray = Array.from({length: 24 }, (_, i) => i)
  const minutesArray = Array.from({length:60}, (_, i) => i)
  const secondsArray = Array.from({length:60}, (_, i) => i)


  const intervalRef = useRef<number | null>(null);
  const anim = useRef(new Animated.Value(0)).current; // animated value for circle


  const startTimer = async () => {
  // Only require one of message or audioURI
  if (!message && !audioURI) return;


  const totalSeconds = hours * 3600 + minutes * 60 + seconds;
  if (totalSeconds <= 0) return;


  setTimeLeft(totalSeconds);
  setRunning(true);

  await scheduleNotification(totalSeconds);


  let remaining = totalSeconds;
  intervalRef.current = setInterval(() => {
    remaining -= 1;
    setTimeLeft(remaining);
    anim.setValue(1 - remaining / totalSeconds);


    if (remaining <= 0) {
      clearInterval(intervalRef.current!);
      setRunning(false);


      (async () => {
        // Play audio if available, otherwise speak the text
        if (audioURI) {
          try {
            const { sound } = await Audio.Sound.createAsync(
              { uri: audioURI },
              { volume: 1.0 }
            );
            await sound.playAsync();
          } catch (error) {
            console.log("Playback error:", error);
            if (message) Speech.speak(message, { volume: 1.0, pitch: 1.2, rate: 1.0 });
          }
        } else if (message) {
          Speech.speak(message, { volume: 1.0, pitch: 1.2, rate: 1.0 });
        }
      })();
    }
  }, 1000);
};


  const resetTimer = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRunning(false);
    setHours(0);
    setMinutes(0);
    setSeconds(0);
    setTimeLeft(0);
    setMessage('');
    anim.setValue(0); // reset animation
  };
async function startRecording() {
  try {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: true,
    });


    const permission = await Audio.requestPermissionsAsync();
    if (!permission.granted) return;


    const newRecording = new Audio.Recording();
    await newRecording.prepareToRecordAsync(recordingOptions);
    await newRecording.startAsync();


    setRecording(newRecording);
    setAudioURI(null); // clear previous audio
    setIsRecording(true);


  } catch (error) {
    console.log("Start recording error:", error);
  }
}
  // Interpolate color from bright red to dark red
  const circleColor = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#800000', '#FF4D4D',],
  });
async function stopRecording() {
  try {
    if (!recording) return;


    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();


    console.log("Recorded URI:", uri);


    setAudioURI(uri ?? null);
    setRecording(null);
    setIsRecording(false);


  } catch (error) {
    console.log("Stop recording error:", error);
  }
}
  async function toggleRecording() {
    await Audio.setAudioModeAsync({
  allowsRecordingIOS: true,
  playsInSilentModeIOS: true,
   staysActiveInBackground: true,
  shouldDuckAndroid: true,
});
  try {
    if (!isRecording) {
      // START RECORDING
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) return;


      const newRecording = new Audio.Recording();
      await newRecording.prepareToRecordAsync(recordingOptions);
      await newRecording.startAsync();


      setRecording(newRecording);
      setAudioURI(null); // clear old audio
      setIsRecording(true);


    } else {
      // STOP RECORDING
      await recording?.stopAndUnloadAsync();
      const uri = recording?.getURI();


      console.log("Recorded URI:", uri);


      setAudioURI(uri ?? null);
      setRecording(null);
      setIsRecording(false);
    }


  } catch (error) {
    console.log("Recording error:", error);
  }
}
async function playAudio(uri: string) {
  try {
    const { sound } = await Audio.Sound.createAsync({ uri },
  { volume: 1.0 });
    await sound.playAsync();
  } catch (error) {
    console.log("Playback error:", error);
  }
}


async function pickAudioFile() {
  try {
    const result = await DocumentPicker.getDocumentAsync({ type: 'audio/*' });
    if ('uri' in result) setAudioURI(result.uri as string);
  } catch (e) {
    console.log('Attachment pick failed:', e);
  }
}


  return (




 


   
  <KeyboardAvoidingView
    style={{ flex: 1 }}
    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
  >
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
    <ScrollView contentContainerStyle={{ alignItems: 'center', justifyContent: 'flex-start'  }}>
    <View style={styles.container}>
   
    {/* Circle + Timer */}
    <Animated.View style={[styles.circle, { borderColor: circleColor }]}>
      <Text style={styles.timer}>{timeLeft}s</Text>
    </Animated.View>
   
    {/* Bottom inputs/buttons */}
    <View style={styles.bottom}>
      <TextInput
        style={[styles.input, { height: 60 }]}
        placeholder="Enter message..."
        placeholderTextColor="gray"
        value={message}
        onChangeText={setMessage}
        multiline
        textAlignVertical="top"
      />


     
    </View>
    <View style = {{ flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginTop: -120 }}>
{/* Hours */}
  <Picker
    selectedValue={hours}
    style={{ width: 100, color: 'red', backgroundColor: '#222' }}
    onValueChange={(value) => setHours(value)}
  >
    {Array.from({ length: 24 }, (_, i) => (
      <Picker.Item key={i} label={i.toString()} value={i} color="red"/>
    ))}
  </Picker>


  {/* Minutes */}
  <Picker
    selectedValue={minutes}
    style={{ width: 100, color: 'red', backgroundColor: '#222' }}
    onValueChange={(value) => setMinutes(value)}
  >
    {Array.from({ length: 60 }, (_, i) => (
      <Picker.Item key={i} label={i.toString()} value={i} color="red"/>
    ))}
  </Picker>


  {/* Seconds */}
  <Picker
    selectedValue={seconds}
    style={{ width: 100, color: 'red', backgroundColor: '#222' }}
    onValueChange={(value) => setSeconds(value)}
  >
    {Array.from({ length: 60 }, (_, i) => (
      <Picker.Item key={i} label={i.toString()} value={i} color="red"/>
    ))}
  </Picker>
 
     
    </View>
    <View style={{ marginTop: 5, width: '90%', alignItems: 'center' }}>
  <Text style={{ color: 'gray', marginBottom: 5 }}>Audio Options: Record Voice (more coming soon)</Text>




  {/* Recording / Playback Controls */}
  <View style={{ flexDirection: 'row', gap: 12, marginTop: 15 }}>
      {/* Select file */}
  {/*<TouchableOpacity onPress={pickAudioFile}>
  <MaterialIcons name="attach-file" size={70} color="gray" />
  </TouchableOpacity>
  */}
    {!isRecording && (
  <>
    {/* No audio yet → normal record */}
    {!audioURI && (
      <TouchableOpacity onPress={startRecording} style={styles.recordButton}>
        <View style={styles.innerCircle} />
      </TouchableOpacity>
    )}


    {/* Audio exists → redo with confirmation */}
    {audioURI && !isRecording && (
  <TouchableOpacity
    onPress={() => setAudioURI(null)}
    style={styles.deleteButton}
  >
    <MaterialIcons name="delete" size={28} color="white" />
  </TouchableOpacity>
)}


    {/* Confirmation UI */}
    {audioURI && confirmingRedo && (
      <View style={{ flexDirection: 'row', gap: 10 }}>
       
      </View>
    )}
  </>
)}
    {/* ⏹ Stop */}
    {isRecording && (
      <TouchableOpacity onPress={stopRecording} style={styles.stopButton} />
    )}


    {/* ▶️ Play + Redo */}
    {!isRecording && audioURI && (
      <>
        <TouchableOpacity
          onPress={() => {
            if (audioURI) playAudio(audioURI);
          }}
          style={styles.playButton}
        >
          <Text style={{ color: 'white', fontSize: 18 }}>▶</Text>
        </TouchableOpacity>


        <TouchableOpacity onPress={startRecording} style={styles.recordButton}>
          <View style={styles.innerCircle} />
        </TouchableOpacity>
      </>
    )}


  </View>


  {/* Start Timer */}
  <View style={{ flexDirection: 'row', justifyContent: 'space-around', width: '45%', marginTop: 10 }}>
  <Button
    title={running ? 'Running...' : 'Start'}
    disabled={running || ((!message && !audioURI && !recording) || (hours + minutes + seconds === 0))}
    onPress={startTimer}
    color="red"
  />
 
  <Button
    title="Reset"
    onPress={resetTimer}
    color="red"
  />
</View>




</View>
    <View style={{ flexDirection: 'row', justifyContent: 'space-around', width: 250, marginTop: 10 }}>
 </View>
  </View>
  </ScrollView>
</TouchableWithoutFeedback>
</KeyboardAvoidingView>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    backgroundColor: 'black',
    paddingTop: 45,
  },
  circle: {
    width: 275,
    height: 275,
    borderRadius: 150,
    borderWidth: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  timer: {
    fontSize: 48,
    color: 'red',
    marginBottom: 20,
  },
  input: {
    width: 350,
    borderColor: 'red',
    borderWidth: 3,
    paddingHorizontal: 15,
    paddingVertical: 5,
    marginBottom: 5,
    color: 'white',
    backgroundColor: '#222',
  },
  bottom: {
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: 'black',
    height: 170,
    width: '100%',
  },
  recordButton: {
  width: 70,
  height: 70,
  borderRadius: 35,
  backgroundColor: 'red',
  justifyContent: 'center',
  alignItems: 'center',
},


innerCircle: {
  width: 50,
  height: 50,
  borderRadius: 25,
  backgroundColor: 'darkred',
},
stopButton: {
  width: 60,
  height: 60,
  backgroundColor: 'red',
  borderRadius: 10,
},


playButton: {
  width: 60,
  height: 60,
  borderRadius: 30,
  backgroundColor: '#333',
  justifyContent: 'center',
  alignItems: 'center',
},
deleteButton: {
  width: 60,
  height: 60,
  borderRadius: 30,
  backgroundColor: '#444',
  justifyContent: 'center',
  alignItems: 'center',
},
});



