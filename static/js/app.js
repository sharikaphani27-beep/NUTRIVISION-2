let foods = [];
let selectedFood = null;

async function loadFoods() {
    try {
        const response = await fetch('/api/foods');
        const data = await response.json();
        foods = data.foods;
    } catch (error) {
        console.error('Error loading foods:', error);
    }
}

function setupSearch() {
    const searchInput = document.getElementById('foodSearch');
    const searchResults = document.getElementById('searchResults');
    const quantityInput = document.getElementById('quantity');
    const searchBtn = document.getElementById('searchBtn');

    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        
        if (query.length < 1) {
            searchResults.classList.remove('active');
            return;
        }

        const filtered = foods.filter(food => 
            food.toLowerCase().includes(query)
        ).slice(0, 10);

        if (filtered.length > 0) {
            searchResults.innerHTML = filtered.map(food => 
                `<div class="search-result-item" data-food="${food}">${food}</div>`
            ).join('');
            searchResults.classList.add('active');
        } else {
            searchResults.classList.remove('active');
        }
    });

    searchResults.addEventListener('click', (e) => {
        if (e.target.classList.contains('search-result-item')) {
            const food = e.target.dataset.food;
            searchInput.value = food;
            selectedFood = food;
            searchResults.classList.remove('active');
        }
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-input-wrapper')) {
            searchResults.classList.remove('active');
        }
    });

    searchBtn.addEventListener('click', () => {
        const food = searchInput.value.trim();
        const quantity = quantityInput.value;
        
        if (food) {
            selectedFood = food;
            fetchNutrition(food, quantity);
        }
    });

    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const food = searchInput.value.trim();
            const quantity = quantityInput.value;
            
            if (food) {
                selectedFood = food;
                fetchNutrition(food, quantity);
            }
        }
    });
}

async function fetchNutrition(food, quantity) {
    const resultsContainer = document.getElementById('resultsContainer');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const errorMessage = document.getElementById('errorMessage');

    resultsContainer.classList.add('hidden');
    errorMessage.classList.add('hidden');
    loadingSpinner.classList.remove('hidden');

    try {
        const response = await fetch('/api/predict', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                food_item: food,
                quantity: parseInt(quantity)
            })
        });

        const data = await response.json();

        if (data.success) {
            displayResults(data.data);
        } else {
            errorMessage.textContent = data.message || 'Food item not found. Please try another search.';
            errorMessage.classList.remove('hidden');
        }
    } catch (error) {
        errorMessage.textContent = 'An error occurred while fetching nutrition data. Please try again.';
        errorMessage.classList.remove('hidden');
    } finally {
        loadingSpinner.classList.add('hidden');
    }
}

function displayResults(data) {
    const resultsContainer = document.getElementById('resultsContainer');
    
    document.getElementById('foodName').textContent = data.food_item;
    document.getElementById('foodCategory').textContent = data.category;
    document.getElementById('caloriesValue').textContent = data.calories;
    document.getElementById('proteinValue').textContent = data.protein;
    document.getElementById('carbsValue').textContent = data.carbohydrates;
    document.getElementById('fatValue').textContent = data.fat;

    const proteinBar = document.querySelector('.nut-bar-fill.protein');
    const carbsBar = document.querySelector('.nut-bar-fill.carbs');
    const fatBar = document.querySelector('.nut-bar-fill.fat');

    setTimeout(() => {
        proteinBar.style.width = Math.min(data.protein * 3, 100) + '%';
        carbsBar.style.width = Math.min(data.carbohydrates * 0.8, 100) + '%';
        fatBar.style.width = Math.min(data.fat * 3, 100) + '%';
    }, 100);

    updateRiskIndicator('obesityRisk', data.obesity_risk);
    updateRiskIndicator('cholesterolRisk', data.cholesterol_risk);

    resultsContainer.classList.remove('hidden');
    resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function updateRiskIndicator(elementId, riskLevel) {
    const container = document.getElementById(elementId);
    const dot = container.querySelector('.risk-dot');
    const text = container.querySelector('.risk-text');

    dot.classList.remove('medium', 'high');

    if (riskLevel === 0) {
        text.textContent = 'Low';
    } else if (riskLevel === 1) {
        text.textContent = 'Medium';
        dot.classList.add('medium');
    } else {
        text.textContent = 'High';
        dot.classList.add('high');
    }
}

function setupCalculator() {
    const calculateBtn = document.getElementById('calculateBtn');
    
    calculateBtn.addEventListener('click', async () => {
        const age = document.getElementById('age').value;
        const gender = document.getElementById('gender').value;
        const weight = document.getElementById('weight').value;
        const height = document.getElementById('height').value;
        const activity = document.getElementById('activity').value;

        try {
            const response = await fetch(`/api/daily-needs?age=${age}&gender=${gender}&weight=${weight}&height=${height}&activity=${activity}`);
            const data = await response.json();

            document.getElementById('dailyCalories').textContent = Math.round(data.calories);
            document.getElementById('dailyProtein').textContent = Math.round(data.protein);
            document.getElementById('dailyCarbs').textContent = Math.round(data.carbohydrates);
            document.getElementById('dailyFat').textContent = Math.round(data.fat);

            document.getElementById('dailyNeedsResults').classList.remove('hidden');
        } catch (error) {
            console.error('Error calculating daily needs:', error);
        }
    });
}

function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-links a');
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                targetSection.scrollIntoView({ behavior: 'smooth' });
                
                navLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
            }
        });
    });

    window.addEventListener('scroll', () => {
        const sections = document.querySelectorAll('section');
        let currentSection = '';
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            
            if (window.scrollY >= sectionTop - 100) {
                currentSection = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${currentSection}`) {
                link.classList.add('active');
            }
        });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    loadFoods();
    setupSearch();
    setupCalculator();
    setupNavigation();
});
