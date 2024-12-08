from flask import Flask, request, jsonify, render_template
import mysql.connector
import os
from writer import Writer


# Explicitly specify the path to the templates folder
# Explicitly specify the locations of templates and static folders
app = Flask(
    __name__,
    template_folder="../templates",
    static_folder="../static"
)

@app.route('/')
def home():
    return render_template('index.html')  # Flask looks for "templates/index.html"

@app.route('/submit-password', methods=['POST'])
def submit_password():
    global writer_instance
    data = request.get_json()
    password = data.get('password')

    if not password:
        return jsonify({"success": False, "error": "Password is required."})

    try:
        # Attempt to replicate the database using the provided password
        writer_instance = Writer(password)
        writer_instance.load_data_to_database()
        return jsonify({"success": True})
    except mysql.connector.Error as err:
        return jsonify({"success": False, "error": str(err)})

@app.route('/search', methods=['GET'])
def search():
    entity = request.args.get('entity')
    name = request.args.get('name', '')
    min_price = request.args.get('min_price', None)
    max_price = request.args.get('max_price', None)
    min_market_value = request.args.get('min_market_value', None)
    max_market_value = request.args.get('max_market_value', None)
    min_shares = request.args.get('min_shares', None)
    max_shares = request.args.get('max_shares', None)

    try:
        connection = writer_instance.connect_to_database()
        cursor = connection.cursor(dictionary=True)

        # Entity-specific query handling
        if entity == 'stocks':
            if (
                not min_price and not max_price and
                not min_market_value and not max_market_value and
                not min_shares and not max_shares
            ):
                # Simple name-based query when only 'name' is provided
                query = """
                    SELECT * FROM stocks
                    WHERE name LIKE %s
                """
                params = (f"%{name}%",)
            else:
                # Full query with filters
                query = """
                    SELECT * FROM stocks
                    WHERE
                        name LIKE %s
                        AND year_end_price BETWEEN %s AND %s
                        AND year_end_market_value BETWEEN %s AND %s
                        AND year_end_shares BETWEEN %s AND %s
                """
                params = (
                    f"%{name}%",
                    float(min_price or 0), float(max_price or float('inf')),
                    float(min_market_value or 0), float(max_market_value or float('inf')),
                    float(min_shares or 0), float(max_shares or float('inf')),
                )
        elif entity == 'companies':
            query = """
                SELECT * FROM companies
                WHERE name LIKE %s
            """
            params = (f"%{name}%",)
        elif entity == 'managers':
            query = """
                SELECT * FROM managers
                WHERE first_name LIKE %s OR last_name LIKE %s
            """
            params = (f"%{name}%", f"%{name}%")
        elif entity == 'investment_banks':
            query = """
                SELECT * FROM investment_banks
                WHERE name LIKE %s
            """
            params = (f"%{name}%",)
        elif entity == 'investment_firms':
            query = """
                SELECT * FROM investment_firms
                WHERE name LIKE %s
            """
            params = (f"%{name}%",)
        elif entity == 'portfolios':
            query = """
                SELECT * FROM portfolios
                WHERE name LIKE %s
            """
            params = (f"%{name}%",)
        else:
            return jsonify({"error": f"Unsupported entity type: {entity}"}), 400

        # Execute the query
        print(f"Executing query: {query} with params: {params}")  # Debugging
        cursor.execute(query, params)
        results = cursor.fetchall()

        return jsonify(results)
    except mysql.connector.Error as error:
        return jsonify({"error": str(error)}), 500
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()



if __name__ == '__main__':
    app.run(debug=True)
