import time
import json
import redis
import random
import cv2
import numpy as np

# Try to import ultralytics, fallback if not available during quick tests
try:
    from ultralytics import YOLO
    model = YOLO('yolov8n.pt')
    HAS_YOLO = True
except ImportError:
    HAS_YOLO = False
    print("⚠️ YOLOv8 not installed. Running in pure simulation mode.")

try:
    r = redis.Redis(host='redis', port=6379, decode_responses=True)
    r.ping()
except:
    r = None

def run_cctv_stream():
    """
    Simulates a real-time CCTV stream processing pipeline.
    In a real factory, this reads from rtsp://camera_feed.
    We generate synthetic frames or use YOLO if available to detect "Person in Restricted Zone".
    """
    print("📹 CCTV Analytics Engine Started (YOLOv8)")
    
    while True:
        time.sleep(10) # Process frames every 10 seconds to avoid spamming
        
        # Simulate a person entering a hazardous zone (Zone 1)
        intrusion_detected = random.random() > 0.8
        
        if intrusion_detected:
            # If YOLO is available, we could run it on a dummy frame to prove it works
            if HAS_YOLO:
                # Create a dummy image (e.g., random noise) just to prove inference runs without crashing
                dummy_frame = np.random.randint(0, 255, (480, 640, 3), dtype=np.uint8)
                _ = model.predict(dummy_frame, verbose=False)
            
            payload = {
                "sensor_id": "CCTV-Z1-01",
                "type": "CCTV_INTRUSION",
                "zone_id": "Z1",
                "confidence": round(random.uniform(0.85, 0.99), 2),
                "bounding_box": [120, 45, 300, 400],
                "timestamp": time.time(),
                "message": "Unauthorized personnel detected in restricted hot-work zone."
            }
            
            if r:
                r.xadd("sensor_stream", {"data": json.dumps(payload)})
            
            print(f"🚨 [CCTV VISION] Person detected in Zone 1. Confidence: {payload['confidence']}")

if __name__ == "__main__":
    run_cctv_stream()
