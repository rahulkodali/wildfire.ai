from flask import Flask, request, jsonify
from flask_cors import CORS
from predictor import WildfirePredictor

from dotenv import load_dotenv
import os
import requests
import math
from geopy.distance import geodesic
import random

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

@app.route("/", methods=["GET"])
def shape_fires():
    ##scrape fires
    url = "https://incidents.fire.ca.gov/umbraco/api/IncidentApi/GeoJsonList?inactive=true"
    response = requests.get(url)

    fires = {}

    if response.status_code == 200:
        data = response.json()

        for feature in data["features"]:
            properties = feature["properties"]
            if properties["IsActive"] == True:
                fires[properties["Name"]] = [
                    properties["Latitude"],
                    properties["Longitude"],
                    properties["AcresBurned"],
                ]

    else:
        print(f"Failed to retrieve data: {response.status_code}")

    dict_vals = fires
    ##shape fires
    for fire_name, fire_data in dict_vals.items():
        points = []

        center = (fire_data[0], fire_data[1])

        acres_burned = 10425
        radius_miles = math.sqrt(acres_burned * 43560) / 5280

        for angle in range(0, 360, 45):
            distance = geodesic(miles=radius_miles).destination(center, angle)
            lat, lon = distance.latitude, distance.longitude

            jagged_lat = lat + random.uniform(-0.005, 0.005)
            jagged_lon = lon + random.uniform(-0.005, 0.005)

            points.append([jagged_lon, jagged_lat])

        points.append(points[0])

        dict_vals[fire_name] = points

    return jsonify(list(dict_vals.values()))



@app.route("/api/route", methods=["POST"])
def route():
    load_dotenv()

    # schema POINT A, POINT B, COORDS OF POLYGON
    data = request.json

    pointA = data['point A']
    pointB = data['point B']
    polygon = data['polygon']


    # iterate/map thru and give a list of coods

    body = {
        "coordinates": [[pointA[0], pointA[1]], [pointB[0], pointB[1]]],
        "options": {
            "avoid_polygons": {
                "type": "MultiPolygon",
                "coordinates": [polygon],
            }
        },
    }

    headers = {
        "Accept": "application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8",
        "Authorization": os.getenv("API_KEY_ROUTE"),
        "Content-Type": "application/json; charset=utf-8",
    }

    call = requests.post(
        "https://api.openrouteservice.org/v2/directions/driving-car/json",
        json=body,
        headers=headers,
    )

    if call.status_code == 200:
        return jsonify(call.json())
    else:
        return jsonify({"error": "Failed to get route", "status": call.status_code}), call.status_code



if __name__ == '__main__':
    initialize_predictor()
    app.run(debug=True, port=5001)