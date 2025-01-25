from flask import Flask, request, jsonify
from dotenv import load_dotenv
import os
import requests

def route(pointA, pointB, polygon):
    load_dotenv()

    # schema POINT A, POINT B, COORDS OF POLYGON



    # iterate/map thru and give a list of coods

    body = {
        "coordinates": [[pointA[0], pointA[1]], [pointB[0], pointB[1]]],
        "options": {
            "avoid_polygons": {
                "type": "Polygon",
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

route([-96.339920, 30.597614],[-96.340612, 30.612040],[[-96.3461393,30.6083298],
      [-96.3450081, 30.6073311],
      [-96.3415942, 30.6118933],
      [-96.333934, 30.5971139],
      [-96.3461393,30.6083298] ])