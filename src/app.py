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
    location = request.args.get('location', '')
    industry = request.args.get('industry', '')
    investment_firm = request.args.get('investment_firm', '')
    min_years_experience = int(request.args.get('min_years_experience', 0))
    max_years_experience = int(request.args.get('max_years_experience', 50))

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
            if entity == 'companies':
                if not location and not industry and not name:
                    # Simple query when no filters are provided
                    query = """
                        SELECT * FROM companies
                    """
                    params = ()
                elif not location and not industry:
                    # Simple name-based query when only 'name' is provided
                    query = """
                        SELECT * FROM companies
                        WHERE name LIKE %s
                    """
                    params = (f"%{name}%",)
                else:
                    # Full query with filters
                    query = """
                        SELECT * FROM companies
                        WHERE
                            name LIKE %s
                            AND (location LIKE %s OR %s = '')
                            AND (industry LIKE %s OR %s = '')
                    """
                    params = (
                        f"%{name}%",
                        f"%{location}%", location or '',
                        f"%{industry}%", industry or '',
                    )
        elif entity == 'managers':
            # Base query
            query = """
                SELECT managers.certification_ID, managers.first_name, managers.last_name,
                    managers.investment_firm_name, managers.years_experience,
                    managers.investment_expertise, managers.personal_intro,
                    portfolios.name AS portfolio
                FROM managers
                LEFT JOIN portfolios ON managers.certification_ID = portfolios.manager_ID
                LEFT JOIN investment_firms ON managers.investment_firm_name = investment_firms.name
                WHERE 1=1
            """

            # Filters
            filters = []
            params = []

            # Filter by name
            if name:
                filters.append("(managers.first_name LIKE %s OR managers.last_name LIKE %s)")
                params.extend([f"%{name}%", f"%{name}%"])

            # Filter by investment firm
            if investment_firm:
                filters.append("managers.investment_firm_name LIKE %s")
                params.append(f"%{investment_firm}%")

            # Filter by years of experience
            if min_years_experience or max_years_experience:
                filters.append("managers.years_experience BETWEEN %s AND %s")
                params.extend([
                    min_years_experience or 0,
                    max_years_experience or 50
                ])

            # Append filters to the query
            if filters:
                query += " AND " + " AND ".join(filters)

            # Execute the query
            cursor.execute(query, tuple(params))

        elif entity == 'investment_banks':
            query = """
                SELECT investment_banks.name, investment_banks.location,
                    investment_banks.industries, investment_banks.ceo_name
                FROM investment_banks
                WHERE 1=1
            """

            # Filters
            filters = []
            params = []

            # Filter by name
            if name:
                filters.append("investment_banks.name LIKE %s")
                params.append(f"%{name}%")

            # Filter by location
            if location:
                filters.append("investment_banks.location LIKE %s")
                params.append(f"%{location}%")

            # Filter by industry
            if industry:
                filters.append("investment_banks.industries LIKE %s")
                params.append(f"%{industry}%")

            # Append filters to the query
            if filters:
                query += " AND " + " AND ".join(filters)

            # Execute the query
            cursor.execute(query, tuple(params))

        elif entity == 'investment_firms':
            query = """
                SELECT * FROM investment_firms
                WHERE name LIKE %s
            """
            params = (f"%{name}%",)
        elif entity == 'portfolios':
            query = """
                SELECT 
                    portfolios.name AS portfolio_name,
                    portfolios.foundation_date,
                    portfolios.year_end_market_value,
                    portfolios.year_end_holders,
                    managers.first_name AS manager_first_name,
                    managers.last_name AS manager_last_name,
                    portfolio_stock_relations.stock_code AS stock_code,
                    stocks.name AS stock_name
                FROM portfolios
                LEFT JOIN managers 
                    ON portfolios.manager_ID = managers.certification_ID
                LEFT JOIN portfolio_stock_relations 
                    ON portfolios.portfolio_code = portfolio_stock_relations.portfolio_code
                LEFT JOIN stocks 
                    ON portfolio_stock_relations.stock_code = stocks.stock_code
                WHERE 1=1
            """
            filters = []
            params = []

            # Stock symbol filter
            if stock_symbol:
                filters.append("stocks.stock_code LIKE %s")
                params.append(f"%{stock_symbol}%")

            # Min and Max Year-End Market Value
            if min_market_value or max_market_value:
                filters.append("portfolios.year_end_market_value BETWEEN %s AND %s")
                params.extend([min_market_value or 0, max_market_value or float('inf')])

            # Min and Max Year-End Holders
            if min_holders or max_holders:
                filters.append("portfolios.year_end_holders BETWEEN %s AND %s")
                params.extend([min_holders or 0, max_holders or float('inf')])

            # Apply filters
            if filters:
                query += " AND " + " AND ".join(filters)

            cursor.execute(query, tuple(params))

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
