from flask import Flask
import requests
from dotenv import load_dotenv
import os

app = Flask(__name__)


@app.route("/api/route", methods=["POST"])
def route():
    load_dotenv()

    # schema POINT A, POINT B, COORDS OF POLYGON
    data = request.json

    # iterate/map thru and give a list of coods
    coordinates = None

    body = {
        "coordinates": [[a[0], a[1]], [b[0], b[1]]],
        "options": {
            "avoid_polygons": {
                "type": "Polygon",
                "coordinates": [coordinates],
            }
        },
    }

    headers = {
        "Accept": "application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8",
        "Authorization": os.getenv(API_KEY_ROUTE),
        "Content-Type": "application/json; charset=utf-8",
    }

    call = requests.post(
        "https://api.openrouteservice.org/v2/directions/driving-car/json",
        json=body,
        headers=headers,
    )

    print(call.status_code, call.reason)
    print(call.text)


@app.route("/hello/<name>")
def hello_name(name):
    return "Hello %s!" % name


if __name__ == "__main__":
    app.run()
