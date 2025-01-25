from flask import Flask, request, jsonify
from flask_cors import CORS
from predictor import WildfirePredictor

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Initialize the predictor globally
MODEL_PATH = 'models/final_model.h5'
predictor = None

def initialize_predictor():
    global predictor
    try:
        predictor = WildfirePredictor(MODEL_PATH)
    except Exception as e:
        print(f"Error initializing predictor: {e}")

@app.route('/predict', methods=['POST', 'GET'])
def predict_wildfire_risk():
    try:
        # Get coordinates from request
        if request.method == 'GET':
            lat = float(request.args.get('lat'))
            lon = float(request.args.get('lon'))
        else:  # POST
            data = request.get_json()
            if not data or 'latitude' not in data or 'longitude' not in data:
                return jsonify({'error': 'Missing latitude or longitude'}), 400
            lat = float(data['latitude'])
            lon = float(data['longitude'])
        
        # Check if predictor is initialized
        if predictor is None:
            return jsonify({'error': 'Predictor not initialized'}), 500
            
        # Get prediction
        result = predictor.predict(lat, lon)
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/hello/<name>')
def hello_name(name):
   return 'Hello %s!' % name

if __name__ == '__main__':
    initialize_predictor()
    app.run(debug=True)