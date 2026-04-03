from flask import Flask, request, jsonify, render_template
import pandas as pd
import numpy as np

app = Flask(__name__, template_folder='templates', static_folder='static')

food_categories = None

def load_model():
    global food_categories
    
    df = pd.read_excel('Food_Nutrition_Dataset_v2.xlsx')
    food_categories = df['Category'].unique().tolist()

def get_nutrition_info(food_item, quantity):
    df = pd.read_excel('Food_Nutrition_Dataset_v2.xlsx')
    
    row = df[df['Food_Item'].str.lower() == food_item.lower()]
    
    if row.empty:
        row = df[df['Food_Item'].str.contains(food_item, case=False, na=False)]
    
    if row.empty:
        return None
    
    row = row.iloc[0]
    scale_factor = quantity / row['Quantity(g)']
    
    return {
        'food_item': str(row['Food_Item']),
        'quantity': int(quantity),
        'calories': float(round(row['Calories'] * scale_factor, 2)),
        'protein': float(round(row['Protein(g)'] * scale_factor, 2)),
        'carbohydrates': float(round(row['Carbohydrates(g)'] * scale_factor, 2)),
        'fat': float(round(row['Fat(g)'] * scale_factor, 2)),
        'category': str(row['Category']),
        'obesity_risk': int(row['Obesity_Risk']),
        'cholesterol_risk': int(row['Cholesterol_Risk'])
    }

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/api/foods', methods=['GET'])
def get_foods():
    df = pd.read_excel('Food_Nutrition_Dataset_v2.xlsx')
    foods = df['Food_Item'].unique().tolist()
    return jsonify({'foods': foods})

@app.route('/api/categories', methods=['GET'])
def get_categories():
    df = pd.read_excel('Food_Nutrition_Dataset_v2.xlsx')
    categories = df['Category'].unique().tolist()
    return jsonify({'categories': categories})

@app.route('/api/predict', methods=['POST'])
def predict():
    data = request.json
    food_item = data.get('food_item')
    quantity = float(data.get('quantity', 100))
    
    nutrition_info = get_nutrition_info(food_item, quantity)
    
    if nutrition_info:
        return jsonify({
            'success': True,
            'data': nutrition_info
        })
    else:
        return jsonify({
            'success': False,
            'message': 'Food item not found'
        }), 404

@app.route('/api/daily-needs', methods=['GET'])
def daily_needs():
    age = int(request.args.get('age', 25))
    gender = request.args.get('gender', 'male')
    weight = float(request.args.get('weight', 70))
    height = float(request.args.get('height', 170))
    activity = request.args.get('activity', 'moderate')
    
    if gender == 'male':
        bmr = 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age)
    else:
        bmr = 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age)
    
    activity_multipliers = {
        'sedentary': 1.2,
        'light': 1.375,
        'moderate': 1.55,
        'active': 1.725,
        'very_active': 1.9
    }
    
    tdee = bmr * activity_multipliers.get(activity, 1.55)
    
    protein_need = weight * 0.8
    
    return jsonify({
        'calories': round(tdee, 0),
        'protein': round(protein_need, 0),
        'carbohydrates': round((tdee * 0.5) / 4, 0),
        'fat': round((tdee * 0.3) / 9, 0)
    })

if __name__ == '__main__':
    load_model()
    app.run(debug=True, port=5000)
