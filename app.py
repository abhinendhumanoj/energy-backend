from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import os
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import MinMaxScaler
from sklearn.metrics import r2_score
import numpy as np

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": ["https://effervescent-longma-22d301.netlify.app"]}})

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

current_df = pd.DataFrame()
energy_model = None
bill_model = None
scaler_X = MinMaxScaler()
scaler_y = MinMaxScaler()
chat_memory = []


@app.route("/")
def home():
    return jsonify({"message": "✅ HITAM Energy Intelligence Backend Running"})


# ================= CSV UPLOAD ================= #
@app.route("/api/upload", methods=["POST"])
def upload_csv():
    global current_df, energy_model, bill_model, scaler_X, scaler_y
    file = request.files.get("file")

    if not file:
        return jsonify({"ok": False, "message": "❌ No file uploaded!"}), 400

    filepath = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(filepath)

    try:
        df = pd.read_csv(filepath, encoding_errors="ignore").dropna(how="all")
        df.columns = [c.strip().lower() for c in df.columns]

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

        # Convert month order numerically
        df["Month_Index"] = np.arange(1, len(df) + 1)

        current_df = df.copy()

        # Train multi-feature regression
        X = df[["Month_Index", "Consumption_kWh"]]
        y = df["Bill_Amount"].values.reshape(-1, 1)

        scaler_X.fit(X)
        scaler_y.fit(y)

        X_scaled = scaler_X.transform(X)
        y_scaled = scaler_y.transform(y)

        bill_model = LinearRegression().fit(X_scaled, y_scaled)
        energy_model = LinearRegression().fit(df[["Month_Index"]], df["Consumption_kWh"])

        accuracy = round(r2_score(y_scaled, bill_model.predict(X_scaled)) * 100, 2)

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
    global current_df, energy_model, bill_model, scaler_X, scaler_y

    if current_df.empty or bill_model is None:
        return jsonify({"ok": False, "message": "⚠️ Please upload a dataset first."})

    try:
        data = request.get_json()
        month_name = data.get("month")

        next_index = len(current_df) + 1
        last_consumption = current_df["Consumption_kWh"].iloc[-1]
        trend = current_df["Consumption_kWh"].pct_change().mean()  # avg monthly growth %
        predicted_consumption = last_consumption * (1 + trend if not np.isnan(trend) else 0.01)

        # Predict next month’s bill using both month index + predicted consumption
        X_future = np.array([[next_index, predicted_consumption]])
        X_scaled = scaler_X.transform(X_future)
        predicted_bill_scaled = bill_model.predict(X_scaled)
        predicted_bill = scaler_y.inverse_transform(predicted_bill_scaled)[0][0]

        # Weighted average with last 3 months to reduce spikes
        if len(current_df) >= 3:
            recent_avg_bill = current_df["Bill_Amount"].tail(3).mean()
            predicted_bill = (predicted_bill * 0.7) + (recent_avg_bill * 0.3)

        growth_rate = ((predicted_bill - current_df["Bill_Amount"].iloc[-1]) /
                       current_df["Bill_Amount"].iloc[-1]) * 100 if current_df["Bill_Amount"].iloc[-1] else 0

        precautions = [
            "🧩 Monitor heavy equipment cycles to control spikes.",
            "💡 Implement energy-efficient scheduling.",
            "📉 Predicted rise in cost can be mitigated with load balancing."
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


# ================= RETRAIN ================= #
@app.route("/api/retrain", methods=["POST"])
def retrain_model():
    global current_df, bill_model, energy_model
    if current_df.empty:
        return jsonify({"ok": False, "message": "⚠️ Upload data before retraining!"})

    try:
        X = current_df[["Month_Index", "Consumption_kWh"]]
        y = current_df["Bill_Amount"]

        bill_model = LinearRegression().fit(X, y)
        energy_model = LinearRegression().fit(current_df[["Month_Index"]], current_df["Consumption_kWh"])
        return jsonify({"ok": True, "message": "✅ Model retrained successfully!"})
    except Exception as e:
        return jsonify({"ok": False, "message": f"❌ Retraining failed: {str(e)}"})


# ================= INSIGHTS ================= #
@app.route("/api/insights_summary", methods=["POST"])
def insights_summary():
    global current_df
    if current_df.empty:
        return jsonify({"ok": False, "summary": "⚠️ Upload a CSV first."})

    total_energy = current_df["Consumption_kWh"].sum()
    avg_bill = current_df["Bill_Amount"].mean()
    top_month = current_df.loc[current_df["Consumption_kWh"].idxmax(), "Month"]
    top_usage = current_df["Consumption_kWh"].max()
    low_month = current_df.loc[current_df["Consumption_kWh"].idxmin(), "Month"]
    low_usage = current_df["Consumption_kWh"].min()
    bill_per_kwh = (current_df["Bill_Amount"] / current_df["Consumption_kWh"].replace(0, 1)).mean()

    summary = f"""
    🧠 **AI Insights Summary**
    • Total Energy: {total_energy:.2f} kWh
    • Avg Monthly Bill: ₹{avg_bill:,.2f}
    • Peak Month: {top_month} ({top_usage:.0f} kWh)
    • Lowest: {low_month} ({low_usage:.0f} kWh)
    • Efficiency: ₹{bill_per_kwh:.2f}/kWh
    """

    return jsonify({"ok": True, "summary": summary})


# ================= CHAT ================= #
@app.route("/api/insights_chat", methods=["POST"])
def insights_chat():
    global current_df, chat_memory
    data = request.get_json()
    query = data.get("query", "").lower().strip()

    if current_df.empty:
        return jsonify({"ok": False, "reply": "⚠️ No data available. Upload CSV first."})

    total_energy = current_df["Consumption_kWh"].sum()
    avg_bill = current_df["Bill_Amount"].mean()
    high_month = current_df.loc[current_df["Consumption_kWh"].idxmax(), "Month"]

    if "bill" in query:
        reply = f"💰 The average monthly bill is ₹{avg_bill:.2f}. Peak month: {high_month}."
    elif "reduce" in query:
        reply = "💡 Reduce heavy-load usage during peak hours and check for power leaks."
    elif "predict" in query:
        reply = "🔮 Use the Predict button to see next month’s energy and bill estimation."
    else:
        reply = "🤖 I can help summarize trends, predict bills, or suggest optimizations."

    chat_memory.append({"user": query, "assistant": reply})
    chat_memory = chat_memory[-5:]
    return jsonify({"ok": True, "reply": reply, "memory": chat_memory})


# ================= LOGIN ================= #
@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json()
    username = data.get("username")
    password = data.get("password")

    if username == "admin" and password == "hitam123":
        return jsonify({"ok": True, "token": "secure_token"})
    return jsonify({"ok": False, "message": "Invalid credentials"})


# ================= SERVER ================= #
if __name__ == "__main__":
    from waitress import serve
    port = int(os.environ.get("PORT", 5000))
    serve(app, host="0.0.0.0", port=port)
