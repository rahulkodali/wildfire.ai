# WildFire - Wildfire Risk & Evacuation System
A web application built during TAMUHack 2025 that helps users monitor wildfire risks, plan evacuation routes, and stay informed about active fires in their area.

Check out this [Github repo](https://github.com/DakshinD/wildfire_prediction) that contains the CNN that we trained for wildfire prediction that was used in this model. Based off this [Kaggle](https://www.kaggle.com/code/vaishnavipatil4848/wildfire-prediction-cnn/notebook) dataset.
## 🔥  Features

- **Risk Assessment**: 
  - ML-powered wildfire risk prediction using satellite imagery and weather data.
  - Interactive map visualization with risk indicators.
  - Address search and location-based analysis.
  - Historical prediction tracking.

- **Real-time Monitoring**:
  - Active fire perimeter mapping.
  - Weather condition integration.
  - AI-generated local fire updates.
  - Risk level confidence scoring.

- **Emergency Planning**:
  - Smart evacuation routing that avoids fire zones.
  - Turn-by-turn navigation.
  - Local emergency resource locator.
  - Safety recommendations based on conditions.

## 🛠️  Tech Stack

### Backend
- Flask web server
- TensorFlow CNN model
- Google Gemini AI
- OpenWeatherMap API
- OpenRouteService API
- GeoPy for spatial calculations

### Frontend
- React + Vite
- Mapbox GL JS
- Radix UI components
- Real-time data visualization

## 📋 Prerequisites

- `Python 3.8+`
- `Node.js 18+`
- API Keys for:
  - Google Gemini AI
  - Mapbox
  - OpenWeatherMap
  - OpenRouteService

## 🚀 Getting Started

1. Clone the repository:

    ```sh
    git clone https://github.com/...
    ```

2. Install backend dependencies:

    ```sh
    cd backend
    pip install -r requirements.txt
    ```

3. Install frontend dependencies:

    ```sh
    cd frontend
    npm install
    ```

4. Configure environment variables:

    Create a `.env` file in the backend directory:

    ```plaintext
    GOOGLE_GEMINI_API_KEY=your_key
    MAPBOX_API_KEY=your_key
    OPENWEATHERMAP_API_KEY=your_key
    OPENROUTESERVICE_API_KEY=your_key
    ```

5. Start the servers:

    - **Backend**:
      ```sh
      python backend.py
      ```

    - **Frontend**:
      ```sh
      npm run dev
      ```

## Usage

1. Use the interactive map to view wildfire risk predictions and active fire zones.

2. Access the evacuation route planner to generate safe navigation paths.

3. Retrieve real-time fire updates using the `/fire-updates` API endpoint.

4. Explore historical fire data and predictions.

## API Endpoints

- **Risk Assessment**:
  - `GET/POST /predict` - Get wildfire risk prediction for coordinates.
  - `GET /weather` - Get weather data and risk factors.
  - `GET /fire-updates` - Get AI-generated fire updates.

- **Routing**:
  - `GET /` - Get active fire perimeter data.
  - `POST /api/route` - Generate evacuation routes.
  - `GET /safety-tips` - Get safety recommendations.

## Key Components

### WildfirePredictionMap
- Interactive map component for visualizing:
  - Risk predictions
  - Active fires
  - Satellite imagery
  - Click-to-analyze functionality

### Real-time Updates
- AI-generated local updates using:
  - Google Gemini integration
  - Location-based context
  - Emergency resource information

---

## Acknowledgments
- TAMUHack 2025 organizers and sponsors
- Google for Gemini AI access
- OpenRouteService for routing capabilities
- Mapbox for mapping services
- OpenWeatherMap for weather data

## Team
- **Team Member 1** - Dakshin Devanand
- **Team Member 2** - Krish Shah  
- **Team Member 3** - Rahul Kodali 
- **Team Member 4** - Armaan Mediratta
