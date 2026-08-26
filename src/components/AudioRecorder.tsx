import { useState, useRef, useEffect } from 'react';
import { Mic, Square, Trash2, Play, Pause, Send } from 'lucide-react';
import { toast } from 'sonner';

interface AudioRecorderProps {
  onSend: (audioBlob: Blob) => void;
  onCancel: () => void;
}

export function AudioRecorder({ onSend, onCancel }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Web Audio Visualizer refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Timer configuration
  useEffect(() => {
    if (isRecording) {
      setRecordingTime(0);
      timerIntervalRef.current = window.setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isRecording]);

  // Audio visualizer drawing loop
  const drawWaveform = () => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      if (!isRecording) return;
      animationFrameRef.current = requestAnimationFrame(draw);

      analyser.getByteTimeDomainData(dataArray);

      // Clean canvas
      ctx.fillStyle = 'rgba(15, 23, 42, 0.4)'; // Dark background matching glassmorphism
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.lineWidth = 3;
      ctx.strokeStyle = '#6366f1'; // Premium indigo stroke
      ctx.beginPath();

      const sliceWidth = (canvas.width * 1.0) / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * canvas.height) / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();
    };

    draw();
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Web Audio setup for visualizer
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      audioCtxRef.current = audioCtx;
      analyserRef.current = analyser;
      sourceRef.current = source;

      // Set up media recorder
      const options = { mimeType: 'audio/webm;codecs=opus' };
      let recorder: MediaRecorder;
      try {
        recorder = new MediaRecorder(stream, options);
      } catch {
        // Fallback for browsers not supporting standard WebM Opus
        recorder = new MediaRecorder(stream);
      }

      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);

        // Cleanup audio visualizer references
        if (audioCtxRef.current) audioCtxRef.current.close();
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      };

      recorder.start();
      setIsRecording(true);
      setAudioUrl(null);
      setTimeout(drawWaveform, 100);
    } catch (err) {
      console.error('Failed to start audio recording:', err);
      toast.error('Failed to access microphone');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    }
  };

  const togglePlayback = () => {
    if (!audioUrl) return;

    if (!audioRef.current) {
      audioRef.current = new Audio(audioUrl);
      audioRef.current.onended = () => setIsPlaying(false);
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true));
    }
  };

  const handleSend = () => {
    if (audioChunksRef.current.length > 0) {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      onSend(audioBlob);
      handleCleanup();
    }
  };

  const handleCleanup = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioUrl(null);
    setIsPlaying(false);
    setRecordingTime(0);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center gap-3 bg-slate-900/90 border border-slate-700/50 rounded-2xl p-4 shadow-xl backdrop-blur max-w-md w-full mx-auto my-2">
      <div className="text-sm font-semibold tracking-wide text-slate-400">
        {isRecording ? 'RECORDING VOICE MESSAGE' : audioUrl ? 'AUDIO PREVIEW' : 'AUDIO RECORDER'}
      </div>

      <div className="relative flex items-center justify-center w-full h-16 rounded-xl overflow-hidden bg-slate-950/80 border border-slate-800">
        {isRecording ? (
          <canvas ref={canvasRef} className="w-full h-full" width={400} height={64} />
        ) : audioUrl ? (
          <div className="flex items-center justify-center gap-2 text-slate-200">
            <span className="text-xs uppercase tracking-wider text-emerald-500 font-bold">Audio Ready</span>
            <span className="text-xs text-slate-400">({formatTime(recordingTime)} Duration)</span>
          </div>
        ) : (
          <div className="text-xs text-slate-500 italic">Tap microphone to begin recording</div>
        )}

        {isRecording && (
          <div className="absolute right-3 top-3 flex items-center gap-1.5 px-2 py-0.5 rounded bg-rose-500/20 border border-rose-500/30 text-rose-500 font-mono text-xs">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            {formatTime(recordingTime)}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between w-full mt-1 px-2">
        <button
          onClick={() => {
            handleCleanup();
            onCancel();
          }}
          className="p-3 rounded-full bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 transition"
          title="Discard Recording"
        >
          <Trash2 size={18} />
        </button>

        <div className="flex items-center justify-center">
          {!isRecording && !audioUrl ? (
            <button
              onClick={startRecording}
              className="p-5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg hover:shadow-indigo-500/30 transition transform hover:scale-105"
              title="Start Recording"
            >
              <Mic size={24} className="animate-pulse" />
            </button>
          ) : isRecording ? (
            <button
              onClick={stopRecording}
              className="p-5 rounded-full bg-rose-600 hover:bg-rose-500 text-white shadow-lg hover:shadow-rose-500/30 transition transform hover:scale-105"
              title="Stop Recording"
            >
              <Square size={24} />
            </button>
          ) : (
            <button
              onClick={togglePlayback}
              className="p-5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg hover:shadow-emerald-500/30 transition transform hover:scale-105"
              title={isPlaying ? 'Pause Preview' : 'Play Preview'}
            >
              {isPlaying ? <Pause size={24} /> : <Play size={24} />}
            </button>
          )}
        </div>

        <button
          onClick={handleSend}
          disabled={!audioUrl}
          className={`p-3 rounded-full transition ${
            audioUrl
              ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow hover:shadow-indigo-500/20'
              : 'bg-slate-800 text-slate-500 border border-slate-800 cursor-not-allowed'
          }`}
          title="Send Encrypted Voice Message"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}
