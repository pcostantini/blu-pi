import picamera
import datetime as dt
# from Adafruit_LSM303 import *

with picamera.PiCamera() as camera:
    camera.resolution = (1280, 720)
    camera.framerate = 24
    camera.start_preview()
    camera.annotate_background = picamera.Color('black')
    camera.annotate_text = dt.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    camera.start_recording('timestamped.h264')
    start = dt.datetime.now()
    # magacc = Adafruit_LSM303();
   
    while (dt.datetime.now() - start).seconds < 5:
        camera.annotate_text = str(magacc.read()[1]).strip('[]')
        camera.annotate_text = dt.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        camera.wait_recording(0.2)

    camera.stop_recording()

