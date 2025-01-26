from flask import Flask, request, jsonify
from flask_cors import CORS
from predictor import WildfirePredictor

from dotenv import load_dotenv
import os
import requests
import math
from geopy.distance import geodesic
import random
import polyline
import google.generativeai as genai


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

    pointA = data["point A"]
    pointB = data["point B"]
    polygon = data["polygon"]

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
        "Authorization": "5b3ce3597851110001cf6248a2d2a8be92064aeda19139927e2415a6",
        "Content-Type": "application/json; charset=utf-8",
    }

    call = requests.post(
        "https://api.openrouteservice.org/v2/directions/driving-car/json",
        json=body,
        headers=headers,
    )

    if call.status_code == 200:
        response = call.json()

        encoded_polyline = response["routes"][0]["geometry"]
        directions = response["routes"][0]["segments"]

        decoded_polyline = polyline.decode(encoded_polyline)

        result = {"decoded_polyline": decoded_polyline, "directions": directions}

        return jsonify(result)
    else:
        return (
            jsonify({"error": "Failed to get route", "status": call.status_code}),
            call.status_code,
        )

@app.route("/api/route-normal", methods=["POST"])
def route_normal():
    load_dotenv()

    # schema POINT A, POINT B, COORDS OF POLYGON
    data = request.json

    pointA = data["point A"]
    pointB = data["point B"]

    # iterate/map thru and give a list of coods

    body = {"coordinates": [[pointA[0], pointA[1]], [pointB[0], pointB[1]]]}

    headers = {
        "Accept": "application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8",
        "Authorization": "5b3ce3597851110001cf6248a2d2a8be92064aeda19139927e2415a6",
        "Content-Type": "application/json; charset=utf-8",
    }

    call = requests.post(
        "https://api.openrouteservice.org/v2/directions/driving-car/json",
        json=body,
        headers=headers,
    )

    if call.status_code == 200:
        response = call.json()

        encoded_polyline = response["routes"][0]["geometry"]
        directions = response["routes"][0]["segments"]

        decoded_polyline = polyline.decode(encoded_polyline)
        print(encoded_polyline)

        result = {"decoded_polyline": decoded_polyline, "directions": directions}

        return jsonify(result)
    else:
        return (
            jsonify({"error": "Failed to get route", "status": call.status_code}),
            call.status_code,
        )
    
@app.route('/weather', methods=['GET'])
def getWeather():
    # Get lat/lon from query parameters
    lat = request.args.get('lat', type=float)
    lon = request.args.get('lon', type=float)
    
    if lat is None or lon is None:
        return jsonify({"error": "Missing lat or lon parameters"}), 400

    # Define the OpenWeatherMap API URL
    url = f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid=d69a05b30d4da7fac23cc30def3b667c"
    
    # Make the API request
    response = requests.get(url)
    
    if response.status_code == 200:
        data = response.json()
        
        def parse_wildfire_relevant_data(data):
            temp_kelvin = data["main"].get("temp")
            temp_fahrenheit = (temp_kelvin - 273.15) * 9 / 5 + 32
            humidity = data["main"].get("humidity")
            wind_speed = data["wind"].get("speed")
            
            wildfire_risk = 0
            
            if temp_fahrenheit > 60:
                wildfire_risk += (temp_fahrenheit - 60) * 0.5  # +0.5 per degree over 60Â°F

            if humidity < 40:
                wildfire_risk += (40 - humidity) * 0.5  # +0.5 per percentage below 40%

            if wind_speed > 5:
                wildfire_risk += (wind_speed - 5) * 1.2  # +1.2 per mph over 5 mph

            wildfire_risk = min(wildfire_risk, 100)
            
            return {
                "temperature_fahrenheit": round(temp_fahrenheit, 2),
                "humidity": humidity,
                "wind_speed": wind_speed,
                "wind_direction": data["wind"].get("deg"),
                "wildfire_risk": round(wildfire_risk, 2),
            }
        
        # Parse and return relevant data
        return jsonify(parse_wildfire_relevant_data(data))
    else:
        return jsonify({"error": f"Failed to fetch weather data. Status code: {response.status_code}"}), response.status_code

@app.route('/fire-updates', methods=['GET'])
def get_fire_updates():
    try:
        # Debug: Print request information
        print("=== Fire Updates Debug ===")
        print(f"Request received at /fire-updates")
        print(f"Request args: {request.args}")
        
        # Get lat/lon from query parameters
        lat = request.args.get('lat', type=float)
        lon = request.args.get('lon', type=float)
        
        print(f"Parsed coordinates: lat={lat}, lon={lon}")
        
        if lat is None or lon is None:
            print("Error: Missing coordinates")
            return jsonify({"error": "Missing lat or lon parameters"}), 400
        
        # Validate latitude and longitude ranges
        if not (-90 <= lat <= 90 and -180 <= lon <= 180):
            return jsonify({"error": "Invalid lat or lon values"}), 400

        # Configure Gemini API (Replace with your key management system)
        genai.configure(api_key="AIzaSyA6wJ0GIqVP7jMaPz-PQg8-ia-ArdURT68")
        model = genai.GenerativeModel("gemini-2.0-flash-exp")
        
        print("Making API call to Gemini...")
        response = model.generate_content(
            f"Tell me current updates regarding forest fires near my location. "
            f"Coordinates: latitude {lat}, longitude {lon}. Keep the response concise. No bullet points. Don't mention coordinates."
        )
        
        # Ensure response text exists
        if not response or not hasattr(response, 'text'):
            return jsonify({"error": "Failed to fetch fire updates"}), 500

        print(f"Gemini response received: {response.text}")
        
        result = {"update": response.text}
        print(f"Sending response: {result}")
        
        return jsonify(result)

    except Exception as e:
        print(f"Error occurred: {str(e)}")
        return jsonify({"error": str(e)}), 500
    
if __name__ == '__main__':
    initialize_predictor()
    app.run(debug=True, port=5001)