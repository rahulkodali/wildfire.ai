import numpy as np
from PIL import Image
import requests
from io import BytesIO
from model import load_model

class WildfirePredictor:
    def __init__(self, model_path):
        """Initialize the predictor with model path"""
        self.model = None
        self.model_path = model_path
        self.load_model()
    
    def load_model(self):
        """Load the model from the specified path"""
        try:
            self.model = load_model(self.model_path)
            print("Model loaded successfully")
        except Exception as e:
            print(f"Error loading model: {e}")
            raise
    
    def preprocess_image(self, image_data, target_size=(64, 64)):
        """Preprocess image data for prediction"""
        img = Image.open(BytesIO(image_data))
        img = img.resize(target_size)
        img_array = np.array(img)
        img_array = img_array.astype('float32') / 255.0
        img_array = np.expand_dims(img_array, axis=0)
        return img_array
    
    def get_satellite_image(self, lat, lon):
        """Get satellite image from Mapbox API using coordinates"""
        # Mapbox API parameters
        zoom = "15.5"
        bearing = "0"
        pitch = "0"
        size = "500x500@2x"
        access_token = "pk.eyJ1IjoiZGFrc2hpbmQiLCJhIjoiY202Y20zdzJqMGx2OTJrcTNkcGFtb2cwayJ9.s7CG8iwMwrMq6Br2C2RtMg"
        
        # Construct the URL
        url = f"https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/{lon},{lat},{zoom},{bearing},{pitch}/{size}?access_token={access_token}"
        
        # Get the image
        response = requests.get(url)
        if response.status_code != 200:
            raise Exception(f"Failed to fetch satellite image: {response.status_code}")
        
        return response.content
    
    def predict(self, lat, lon):
        """Main prediction method that coordinates all steps"""
        try:
            # Get satellite image
            image_data = self.get_satellite_image(lat, lon)
            
            # Preprocess image
            processed_image = self.preprocess_image(image_data)
            
            # Make prediction
            if self.model is None:
                raise Exception("Model not loaded")
                
            prediction = float(self.model.predict(processed_image)[0][0])
            
            return {
                'probability': prediction,
                'risk_level': 'High Risk' if prediction > 0.5 else 'Low Risk',
                'confidence': float(max(prediction, 1-prediction)),
                'coordinates': {'lat': lat, 'lon': lon}
            }
            
        except Exception as e:
            raise Exception(f"Prediction failed: {str(e)}") 