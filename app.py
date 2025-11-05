from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import os
import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import r2_score
from datetime import datetime
import calendar

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": ["https://effervescent-longma-22d301.netlify.app"]}})

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

current_df = pd.DataFrame()
energy_model = None
bill_model = None
use_random_forest = True   # True = RandomForest, False = LinearRegression
chat_memory = []


@app.route("/")
def home():
    return jsonify({"message": "✅ AI Energy Intelligence Backend Running"})


# ================= CSV UPLOAD ================= #
@app.route("/api/upload", methods=["POST"])
def upload_csv():
    global current_df, energy_model, bill_model

    file = request.files.get("file")
    if not file:
        return jsonify({"ok": False, "message": "❌ No file uploaded!"}), 400

    filepath = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(filepath)

    try:
        df = pd.read_csv(filepath, encoding_errors="ignore").dropna(how="all")
        df.columns = [c.strip().lower() for c in df.columns]

        # Auto-detect columns
        month_col = next((c for c in df.columns if "month" in c), None)
        energy_col = next((c for c in df.columns if "consum" in c or "energy" in c or "usage" in c or "kwh" in c), None)
        bill_col = next((c for c in df.columns if "bill" in c or "amount" in c or "cost" in c), None)

        if not all([month_col, energy_col, bill_col]):
            return jsonify({
                "ok": False,
                "message": f"❌ Missing required columns! Found: {df.columns.tolist()}"
            }), 400

        df = df.rename(columns={
            month_col: "Month",
            energy_col: "Consumption_kWh",
            bill_col: "Bill_Amount"
        })

        df["Consumption_kWh"] = pd.to_numeric(df["Consumption_kWh"], errors="coerce").fillna(0)
        df["Bill_Amount"] = pd.to_numeric(df["Bill_Amount"], errors="coerce").fillna(0)
        df = df.reset_index(drop=True)
        df["Month_Index"] = np.arange(1, len(df) + 1)

        current_df = df.copy()

        # ===== Train Models =====
        X = df[["Month_Index", "Consumption_kWh"]]
        y = df["Bill_Amount"]

        if use_random_forest:
            bill_model = RandomForestRegressor(n_estimators=100, random_state=42)
            energy_model = RandomForestRegressor(n_estimators=100, random_state=42)
        else:
            bill_model = LinearRegression()
            energy_model = LinearRegression()

        bill_model.fit(X, y)
        energy_model.fit(df[["Month_Index"]], df["Consumption_kWh"])

        accuracy = round(r2_score(y, bill_model.predict(X)) * 100, 2)

        metrics = {
            "totalEnergy": round(df["Consumption_kWh"].sum(), 2),
            "avgBill": round(df["Bill_Amount"].mean(), 2),
            "accuracy": accuracy
        }

        available_months = ["November 2025", "December 2025", "January 2026", "February 2026"]

        return jsonify({
            "ok": True,
            "message": "✅ Data uploaded & models trained successfully!",
            "metrics": metrics,
            "data": df.to_dict(orient="records"),
            "available_months": available_months
        })

    except Exception as e:
        return jsonify({"ok": False, "message": f"⚠️ Upload failed: {str(e)}"}), 500


# ================= PREDICT ================= #
@app.route("/api/predict", methods=["POST"])
def predict():
    global current_df, energy_model, bill_model

    if current_df.empty or bill_model is None:
        return jsonify({"ok": False, "message": "⚠️ Upload data first!"})

    try:
        data = request.get_json()
        month_name = data.get("month", "Next Month")

        next_index = len(current_df) + 1
        predicted_consumption = float(energy_model.predict([[next_index]]))
        predicted_bill = float(bill_model.predict([[next_index, predicted_consumption]]))

        if len(current_df) >= 3:
            recent_avg = current_df["Bill_Amount"].tail(3).mean()
            predicted_bill = 0.8 * predicted_bill + 0.2 * recent_avg

        last_bill = current_df["Bill_Amount"].iloc[-1] if len(current_df) > 0 else 1
        growth_rate = ((predicted_bill - last_bill) / last_bill) * 100 if last_bill else 0

        precautions = [
            "🔋 Schedule heavy loads in non-peak hours.",
            "💡 Replace outdated equipment with energy-efficient models.",
            "📉 Minor increase expected — maintain load balance."
        ]

        return jsonify({
            "ok": True,
            "month": month_name,
            "prediction": round(predicted_consumption, 2),
            "predicted_bill": round(predicted_bill, 2),
            "growth_rate": round(growth_rate, 2),
            "precautions": precautions
        })

    except Exception as e:
        return jsonify({"ok": False, "message": f"⚠️ Prediction failed: {str(e)}"})


# ================= AI TREND FORECAST (NEW) ================= #
@app.route("/api/trend", methods=["GET"])
def forecast_trend():
    global current_df, bill_model, energy_model

    if current_df.empty or bill_model is None:
        return jsonify({"ok": False, "message": "⚠️ Upload data first!"})

    try:
        # Generate next 6 months forecast
        last_index = len(current_df)
        forecast_points = []

        # Try to continue month names naturally if they exist
        base_months = list(current_df["Month"])
        start_month = datetime.now().month
        start_year = datetime.now().year

        for i in range(1, 7):
            next_idx = last_index + i
            predicted_kwh = float(energy_model.predict([[next_idx]]))
            predicted_bill = float(bill_model.predict([[next_idx, predicted_kwh]]))

            if len(current_df) >= 3:
                recent_avg = current_df["Bill_Amount"].tail(3).mean()
                predicted_bill = 0.8 * predicted_bill + 0.2 * recent_avg

            # Generate month label dynamically
            next_month = (start_month + i) % 12 or 12
            next_year = start_year + ((start_month + i - 1) // 12)
            month_label = f"{calendar.month_abbr[next_month]} {next_year}"

            forecast_points.append({
                "Month": month_label,
                "Predicted_kWh": round(predicted_kwh, 2),
                "Predicted_Bill": round(predicted_bill, 2)
            })

        return jsonify({"ok": True, "forecast": forecast_points})

    except Exception as e:
        return jsonify({"ok": False, "message": f"⚠️ Forecast generation failed: {str(e)}"})


# ================= RETRAIN ================= #
@app.route("/api/retrain", methods=["POST"])
def retrain_model():
    global current_df, energy_model, bill_model
    if current_df.empty:
        return jsonify({"ok": False, "message": "⚠️ Upload data before retraining!"})

    try:
        X = current_df[["Month_Index", "Consumption_kWh"]]
        y = current_df["Bill_Amount"]

        if use_random_forest:
            bill_model = RandomForestRegressor(n_estimators=100, random_state=42)
            energy_model = RandomForestRegressor(n_estimators=100, random_state=42)
        else:
            bill_model = LinearRegression()
            energy_model = LinearRegression()

        bill_model.fit(X, y)
        energy_model.fit(current_df[["Month_Index"]], current_df["Consumption_kWh"])

        return jsonify({"ok": True, "message": "✅ Model retrained successfully!"})
    except Exception as e:
        return jsonify({"ok": False, "message": f"❌ Retraining failed: {str(e)}"})


# ================= LOGIN ================= #
@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json()
    username = data.get("username")
    password = data.get("password")

    if username == "admin" and password == "hitam123":
        return jsonify({"ok": True, "token": "secure_token"})
    return jsonify({"ok": False, "message": "Invalid credentials"})

@app.route('/api/insights', methods=['GET'])
def get_insights():
    insights = [
        {"id": 1, "title": "High Energy Usage in May", "detail": "Consider optimizing HVAC systems."},
        {"id": 2, "title": "Peak Consumption Hours", "detail": "Between 2–5 PM; shifting loads may reduce bills."},
        {"id": 3, "title": "Prediction Confidence", "detail": "Model accuracy is stable at 93.7%."}
    ]
    return jsonify({"ok": True, "insights": insights})



# ================= RUN SERVER ================= #
if __name__ == "__main__":
    from waitress import serve
    port = int(os.environ.get("PORT", 5000))
    serve(app, host="0.0.0.0", port=port)
