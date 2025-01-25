from flask import Flask, request, jsonify
from dotenv import load_dotenv
import os
import requests
import math
from geopy.distance import geodesic
import random


def test():
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

    return fires


def jag(dict_vals):
    for fire_name, fire_data in dict_vals.items():
        points = []

        center = (fire_data[0], fire_data[1])

        acres_burned = 10425
        radius_miles = math.sqrt(acres_burned * 43560) / 5280

        for angle in range(45, 360, 45):
            distance = geodesic(miles=radius_miles).destination(center, angle)
            lat, lon = distance.latitude, distance.longitude

            jagged_lat = lat + random.uniform(-0.005, 0.005)
            jagged_lon = lon + random.uniform(-0.005, 0.005)

            points.append([jagged_lon, jagged_lat])

        points.append(points[0])

        dict_vals[fire_name] = points

    return list(dict_vals.values())


def route(pointA, pointB, polygon):
    load_dotenv()

    # schema POINT A, POINT B, COORDS OF POLYGON

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

    print(call.status_code, call.reason)
    print(call.text)


route([-96.339920, 30.597614], [-96.340612, 30.612040], jag(test()))


# val = test()
# trueVal = jag(val)
# print(trueVal)
