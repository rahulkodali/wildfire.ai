from flask import Flask

app = Flask(__name__)


@app.route("/api/route", methods=["POST"])
def route():
    data = request.json


@app.route("/hello/<name>")
def hello_name(name):
    return "Hello %s!" % name


if __name__ == "__main__":
    app.run()
