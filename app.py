from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import os
from sklearn.linear_model import LinearRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import r2_score

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": ["https://effervescent-longma-22d301.netlify.app"]}})

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

current_df = pd.DataFrame()
consumption_model = None
bill_model = None
chat_memory = []


@app.route("/")
def home():
    return jsonify({"message": "✅ HITAM Energy Intelligence Backend Running"})


# ================= CSV UPLOAD ================= #
@app.route("/api/upload", methods=["POST"])
def upload_csv():
    global current_df, consumption_model, bill_model
    file = request.files.get("file")

    if not file:
        return jsonify({"ok": False, "message": "❌ No file uploaded!"}), 400

    filepath = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(filepath)

    available_months = [
        "October 2025", "November 2025", "December 2025", "January 2026"
    ]

    try:
        df = pd.read_csv(filepath, encoding_errors="ignore")
        df = df.dropna(how="all")
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
        df["Month"] = df["Month"].fillna("Unknown")

        current_df = df.copy()

        # Train models
        if len(df) > 3:
            X = df.index.values.reshape(-1, 1)
            y_energy = df["Consumption_kWh"]
            y_bill = df["Bill_Amount"]

            X_train, X_test, y_train, y_test = train_test_split(X, y_energy, test_size=0.2, random_state=42)
            X_train2, X_test2, y2_train, y2_test = train_test_split(X, y_bill, test_size=0.2, random_state=42)

            consumption_model = LinearRegression().fit(X_train, y_train)
            bill_model = LinearRegression().fit(X_train2, y2_train)

            acc_energy = r2_score(y_test, consumption_model.predict(X_test)) * 100
            acc_bill = r2_score(y2_test, bill_model.predict(X_test2)) * 100
            accuracy = round((acc_energy + acc_bill) / 2, 2)
        else:
            accuracy = 0

        metrics = {
            "totalEnergy": round(df["Consumption_kWh"].sum(), 2),
            "avgBill": round(df["Bill_Amount"].mean(), 2),
            "accuracy": accuracy
        }

        return jsonify({
            "ok": True,
            "message": "✅ CSV uploaded successfully and models trained!",
            "metrics": metrics,
            "data": df.to_dict(orient="records"),
            "available_months": available_months
        })

    except Exception as e:
        return jsonify({"ok": False, "message": f"⚠️ Upload failed: {str(e)}"}), 500


# ================= PREDICT ================= #
@app.route("/api/predict", methods=["POST"])
def predict():
    global current_df, consumption_model, bill_model
    if current_df.empty or consumption_model is None or bill_model is None:
        return jsonify({"ok": False, "message": "⚠️ Upload a CSV before predicting!"})

    try:
        data = request.get_json()
        month_name = data.get("month")

        if not month_name:
            return jsonify({"ok": False, "message": "❌ Please provide a month name!"})

        next_index = len(current_df)

        predicted_consumption = consumption_model.predict([[next_index]])[0]
        predicted_bill = bill_model.predict([[next_index]])[0]

        # Smooth out using recent 3-month average to avoid spikes
        if len(current_df) >= 3:
            recent_bills = current_df["Bill_Amount"].tail(3).mean()
            predicted_bill = (predicted_bill + recent_bills) / 2

        # Month-over-month growth tracking
        growth_rate = 0
        if len(current_df) > 1:
            last_bill = current_df["Bill_Amount"].iloc[-1]
            second_last_bill = current_df["Bill_Amount"].iloc[-2]
            if second_last_bill > 0:
                growth_rate = ((last_bill - second_last_bill) / second_last_bill) * 100

        precautions = [
            "🔋 Optimize high-load hours to reduce peaks.",
            "⚙️ Perform equipment maintenance to sustain efficiency.",
            "📊 Analyze last 3 months for usage optimization."
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
    global current_df, consumption_model, bill_model

    if current_df.empty:
        return jsonify({"ok": False, "message": "⚠️ Upload data before retraining!"})

    try:
        X = current_df.index.values.reshape(-1, 1)
        y1 = current_df["Consumption_kWh"]
        y2 = current_df["Bill_Amount"]

        consumption_model = LinearRegression().fit(X, y1)
        bill_model = LinearRegression().fit(X, y2)

        return jsonify({"ok": True, "message": "✅ Models retrained successfully!"})
    except Exception as e:
        return jsonify({"ok": False, "message": f"❌ Retraining failed: {str(e)}"})


# ================= INSIGHTS ================= #
@app.route("/api/insights_summary", methods=["POST"])
def insights_summary():
    global current_df

    if current_df.empty:
        return jsonify({
            "ok": False,
            "summary": "⚠️ No data available. Please upload a CSV first."
        })

    try:
        total_energy = current_df["Consumption_kWh"].sum()
        avg_bill = current_df["Bill_Amount"].mean()
        top_month = current_df.loc[current_df["Consumption_kWh"].idxmax(), "Month"]
        top_usage = current_df["Consumption_kWh"].max()
        low_month = current_df.loc[current_df["Consumption_kWh"].idxmin(), "Month"]
        low_usage = current_df["Consumption_kWh"].min()
        bill_per_kwh = (current_df["Bill_Amount"] / current_df["Consumption_kWh"].replace(0, 1)).mean()

        summary = f"""
        🧠 **AI Energy Insights Summary**

        - Total consumption: **{total_energy:.2f} kWh**
        - Average monthly bill: **₹{avg_bill:,.0f}**
        - Peak consumption in **{top_month}** ({top_usage:.0f} kWh)
        - Lowest in **{low_month}** ({low_usage:.0f} kWh)
        - Avg cost efficiency: **₹{bill_per_kwh:.2f}/kWh**
        """

        return jsonify({"ok": True, "summary": summary})

    except Exception as e:
        return jsonify({"ok": False, "summary": f"⚠️ Summary generation failed: {str(e)}"})


# ================= CHAT BOT ================= #
@app.route("/api/insights_chat", methods=["POST"])
def insights_chat():
    global current_df, chat_memory

    data = request.get_json()
    query = data.get("query", "").lower().strip()

    if current_df.empty:
        return jsonify({
            "ok": False,
            "reply": "⚠️ No data available. Please upload your CSV first."
        })

    total_energy = current_df["Consumption_kWh"].sum()
    avg_bill = current_df["Bill_Amount"].mean()
    highest_month = current_df.loc[current_df["Consumption_kWh"].idxmax(), "Month"]
    lowest_month = current_df.loc[current_df["Consumption_kWh"].idxmin(), "Month"]

    if "bill" in query:
        reply = f"💰 Your average monthly bill is ₹{avg_bill:.2f}. The highest was in {highest_month}."
    elif "energy" in query or "usage" in query:
        reply = f"⚡ Total recorded usage: {total_energy:.2f} kWh. Peak in {highest_month}, lowest in {lowest_month}."
    elif "reduce" in query or "save" in query:
        reply = "🔋 Try using appliances during off-peak hours and monitor top 3 high-consumption months."
    elif "predict" in query:
        reply = "🔮 Use the 'Predict' feature to forecast upcoming month bills using AI regression."
    elif "thanks" in query:
        reply = "😊 You're welcome! You can ask for summaries or predictions anytime."
    else:
        reply = "🤖 I can analyze your energy trends, give insights, or forecast next month’s bill!"

    chat_memory.append({"user": query, "assistant": reply})
    chat_memory = chat_memory[-5:]  # Limit memory

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


# ================= SAVE CHAT ================= #
@app.route("/api/save_chat", methods=["POST"])
def save_chat():
    data = request.get_json()
    user = data.get("user", "Anonymous")
    conversation = data.get("conversation", [])
    print(f"💾 Saved chat for {user} with {len(conversation)} messages")
    return jsonify({"ok": True, "message": "Chat saved successfully!"})


# ================= SERVER ================= #
if __name__ == "__main__":
    from waitress import serve
    port = int(os.environ.get("PORT", 5000))
    serve(app, host="0.0.0.0", port=port)
