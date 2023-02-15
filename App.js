import * as React from 'react';
import {useCallback, useRef, useState, useEffect} from 'react';
import {
  ActivityIndicator,
  Button,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {Camera, Canvas, Image} from 'react-native-pytorch-core';
import detectObjects from './ObjectDetector';



const objectColors = [
  "#FF3B30",
  "#5856D6",
  "#34C759",
  "#007AFF",
  "#FF9500",
  "#AF52DE",
  "#5AC8FA",
  "#FFCC00",
  "#FF2D55",
];

const textBaselineAdjustment = Platform.OS == "ios" ? 7 : 4;
export default function ObjectDetectionExample() {
  //const [image, setImage] = useState(null);
  //const [boundingBoxes, setBoundingBoxes] = useState(null);
  // const [screenState, setScreenState] = useState(ScreenStates.CAMERA);
  //const cameraRef = useRef(null);
  const [ctx, setCtx] = useState(null);
  const [layout, setLayout] = useState(null);



  // Handle the reset button and return to the camera capturing mode
  // const handleReset = useCallback(async () => {
  //   setScreenState(ScreenStates.CAMERA);
  //   if (image != null) {
  //     await image.release();
  //   }
  //   setImage(null);
  //   setBoundingBoxes(null);
  // }, [image, setScreenState]);

  // // This handler function handles the camera's capture event
  async function handleFrame(image) {
    
    try {
      
      const newBoxes = await detectObjects(image);
      //setBoundingBoxes(newBoxes);
      drawImage(image,newBoxes)
      // Switch to the ResultsScreen to display the detected objects
      //setScreenState(ScreenStates.RESULTS);
    }catch (err) {
      // In case something goes wrong, go back to the CameraScreen to take a new picture
      console.log(err)
    }
    await image.release()
    // Wait for image to process through DETR model and draw resulting image
  }
async function drawImage(image, boundingBoxes){
  
  if (ctx != null && layout != null && image != null) {
    ctx.clearRect(0, 0, layout.width, layout.height);

    // Scale image to fit screen
    const imageWidth = image.getWidth();
    const imageHeight = image.getHeight();
    const scale = Math.max(
      layout.width / imageWidth,
      layout.height / imageHeight
    );
    const displayWidth = imageWidth * scale;
    const displayHeight = imageHeight * scale;
    const offsetX = (layout.width - displayWidth) / 2;
    const offsetY = (layout.height - displayHeight) / 2;
    ctx.drawImage(image, offsetX, offsetY, displayWidth, displayHeight);

    // draw bounding boxes and label them, if provided
    if (boundingBoxes) {
      ctx.font = `13px monospace`;
      ctx.fillStyle = "#000";
      ctx.textAlign = "left";

      boundingBoxes.forEach((boundingBox, index) => {
        const { objectClass, bounds } = boundingBox;
        const x = offsetX + bounds[0] * scale;
        const y = offsetY + bounds[1] * scale;
        const w = bounds[2] * scale;
        const h = bounds[3] * scale;

        const boxColor = objectColors[index % objectColors.length];
        ctx.strokeStyle = boxColor;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.rect(x, y, w, h);
        ctx.stroke();

        const textHorizontalPadding = 10;
        const textWidth =
          objectClass.length * 6 + 2 * textHorizontalPadding;
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 25;
        ctx.lineCap = "round";
        ctx.beginPath();
        const textStartX = x + w / 2 - textWidth / 2;
        ctx.moveTo(textStartX, y);
        ctx.lineTo(textStartX + textWidth, y);
        ctx.stroke();

        ctx.fillStyle = "#fff";
        ctx.fillText(objectClass, textStartX, y + textBaselineAdjustment);
      });
      ctx.invalidate();
    }
  }


        
      
  }
  return (
    <SafeAreaView style={styles.container}>
      <Camera
      style={styles.camera}
      onFrame = {handleFrame}
      targetResolution={{ width: 1080, height: 1920 }}
      hideCaptureButton = {true}
     />
     <Canvas
        style={StyleSheet.absoluteFill}
        onLayout={(event) => {
          setLayout(event.nativeEvent.layout);
        }}
        onContext2D={setCtx}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  camera: { width: "100%", height: "100%" },
});