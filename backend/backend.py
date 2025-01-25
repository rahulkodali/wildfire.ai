from flask import Flask, request, jsonify
from dotenv import load_dotenv
import os
import requests
import math
from geopy.distance import geodesic
import random

app = Flask(__name__)

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


@app.route("/hello/<name>")
def hello_name(name):
    return "Hello %s!" % name


if __name__ == "__main__":
    app.run()
