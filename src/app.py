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
    headquarters_location = request.args.get('headquarters_location', '')
    industry = request.args.get('industry', '')
    investment_firm_name = request.args.get('investment_firm_name', None)
    min_years_experience = int(request.args.get('min_years_experience', 0))
    max_years_experience = int(request.args.get('max_years_experience', 50))
    stock_symbol = request.args.get('stock_symbol', '')  
    min_holders = request.args.get('min_holders', None)  
    max_holders = request.args.get('max_holders', None) 
    location = request.args.get('location', '')
    min_price2 = request.args.get('min_price2', None)
    max_price2 = request.args.get('max_price2', None)
    min_market_value2 = request.args.get('min_market_value2', None)
    max_market_value2 = request.args.get('max_market_value2', None)
    min_shares2 = request.args.get('min_shares2', None)
    max_shares2 = request.args.get('max_shares2', None)

    try:
        connection = writer_instance.connect_to_database()
        cursor = connection.cursor(buffered=True, dictionary=True)

        # Entity-specific query handling
        if entity == 'stocks':
            # Parse the display fields from the query parameters
            display_fields = request.args.get('display_fields', 'code,name,year_end_price,year_end_shares,year_end_market_value').split(',')
            valid_fields = {
                'code': 'stock_code',
                'name': 'name',
                'year_end_price': 'year_end_price',
                'year_end_shares': 'year_end_shares',
                'year_end_market_value': 'year_end_market_value',
            }
            
            # Map the selected display fields to actual database column names
            selected_columns = [valid_fields[field] for field in display_fields if field in valid_fields]
            
            # Default to all fields if no valid display fields are selected
            if not selected_columns:
                selected_columns = list(valid_fields.values())

            # Join selected columns into the SELECT statement
            columns_to_select = ', '.join(selected_columns)

            if (
                not min_price and not max_price and
                not min_market_value and not max_market_value and
                not min_shares and not max_shares
            ):
                # Simple name-based query when only 'name' is provided
                query = f"""
                    SELECT {columns_to_select}
                    FROM stocks
                    WHERE name LIKE %s
                """
                params = (f"%{name}%",)
            else:
                # Full query with filters
                query = f"""
                    SELECT {columns_to_select}
                    FROM stocks
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
            # Get the display fields from the request
            display_fields = request.args.get('display_fields', '').split(',')

            # Define allowed fields
            allowed_fields = [
                "name", "location", "phone_number", "ceo_name", "industry",
                "company_info", "symbol", "year_end_price2", "year_end_market_value2", "year_end_shares2"
            ]

            # Validate and use only allowed fields
            selected_fields = [field for field in display_fields if field in allowed_fields]
            if 'symbol' not in selected_fields:
                selected_fields.append('symbol')

            # Construct the SELECT clause dynamically
            field_mapping = {
                "name": "companies.name",
                "location": "companies.location",
                "phone_number": "companies.phone_number",
                "ceo_name": "companies.ceo_name",
                "industry": "companies.industry",
                "company_info": "companies.company_info",
                "symbol": "stocks.stock_code AS symbol",
                "year_end_price2": "stocks.year_end_price AS year_end_price2",
                "year_end_market_value2": "stocks.year_end_market_value AS year_end_market_value2",
                "year_end_shares2": "stocks.year_end_shares AS year_end_shares2"
            }
            fields_to_select = ", ".join(field_mapping[field] for field in selected_fields)

            # Build the query
            query = f"""
                SELECT {fields_to_select}
                FROM companies
                LEFT JOIN stocks ON companies.company_id = stocks.company_id
                WHERE 1=1
            """

            # Filters
            filters = []
            params = []

            # Filter by name
            if name:
                filters.append("companies.name LIKE %s")
                params.append(f"%{name}%")

            # Filter by location
            if location:
                filters.append("companies.location LIKE %s")
                params.append(f"%{location}%")

            # Filter by industry
            if industry:
                filters.append("companies.industry LIKE %s")
                params.append(f"%{industry}%")

            # Filter by stocks.year_end_price
            if min_price2 or max_price2:
                filters.append("stocks.year_end_price BETWEEN %s AND %s")
                params.extend([
                    float(min_price2 or 0),
                    float(max_price2 or float('inf'))
                ])

            # Filter by stocks.year_end_market_value
            if min_market_value2 or max_market_value2:
                filters.append("stocks.year_end_market_value BETWEEN %s AND %s")
                params.extend([
                    float(min_market_value2 or 0),
                    float(max_market_value2 or float('inf'))
                ])

            # Filter by stocks.year_end_shares
            if min_shares2 or max_shares2:
                filters.append("stocks.year_end_shares BETWEEN %s AND %s")
                params.extend([
                    float(min_shares2 or 0),
                    float(max_shares2 or float('inf'))
                ])

            # Append filters
            if filters:
                query += " AND " + " AND ".join(filters)

            # Debugging
            print(f"Executing query: {query}")
            print(f"With parameters: {params}")

            # Execute the query
            cursor.execute(query, tuple(params))




        elif entity == 'managers':
            # Get display fields from the request
            display_fields = request.args.get('display_fields', '').split(',')
            if not display_fields or display_fields == ['']:
                # Default to select all fields if no display fields are specified
                selected_fields = """
                    managers.manager_id, 
                    CONCAT(managers.first_name, ' ', managers.last_name) AS name,
                    investment_firms.name AS investment_firm_name,
                    managers.years_experience, 
                    managers.investment_expertise, 
                    managers.personal_intro, 
                    GROUP_CONCAT(DISTINCT portfolios.name ORDER BY portfolios.name ASC SEPARATOR '; ') AS portfolio_owned
                """
            else:
                # Dynamically build the fields to select
                field_mapping = {
                    'id': "managers.manager_id",
                    'name': "CONCAT(managers.first_name, ' ', managers.last_name) AS name",
                    'investment_firm_name': "investment_firms.name AS investment_firm_name",
                    'years_experience': "managers.years_experience",
                    'field_of_expertise': "managers.investment_expertise",
                    'personal_intro_text': "managers.personal_intro",
                    'portfolio': "GROUP_CONCAT(DISTINCT portfolios.name ORDER BY portfolios.name ASC SEPARATOR '; ') AS portfolio_owned"
                }
                selected_fields = ", ".join(field_mapping[field] for field in display_fields if field in field_mapping)

            # Base query with dynamic fields
            query = f"""
                SELECT {selected_fields}
                FROM managers
                LEFT JOIN investment_firms ON managers.firm_id = investment_firms.firm_id
                LEFT JOIN portfolios ON managers.manager_id = portfolios.manager_id
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
            if investment_firm_name:
                filters.append("investment_firms.name LIKE %s")
                params.append(f"%{investment_firm_name}%")

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

            # Dynamically construct GROUP BY based on selected fields
            group_by_fields = [
                "managers.manager_id", 
                "managers.first_name", 
                "managers.last_name", 
                "investment_firms.name",
                "managers.years_experience", 
                "managers.investment_expertise", 
                "managers.personal_intro"
            ]
            query += " GROUP BY " + ", ".join(group_by_fields)

            # Execute the query
            print(f"Executing query: {query}")
            print(f"Selected Fields: {selected_fields}")  # Debugging
            print(f"Filters: {filters}")
            print(f"Params: {params}")
            cursor.execute(query, tuple(params))





        elif entity == 'investment_banks':
            # Get display fields from the request
            display_fields = request.args.get('display_fields', '').split(',')

            # Define allowed fields
            allowed_fields = {
                "name": "investment_banks.name",
                "location": "investment_banks.headquarters_location",
                "industries": "investment_banks.industries",
                "ceo_name": "investment_banks.ceo_name",
                "foundation_date": "investment_banks.foundation_date",
                "companies_managed": "GROUP_CONCAT(DISTINCT companies.name ORDER BY companies.name ASC SEPARATOR ', ') AS companies_managed"
            }

            # Determine which fields to select
            selected_fields = [allowed_fields[field] for field in display_fields if field in allowed_fields]

            # Default to all fields if no display preferences are selected
            if not selected_fields:
                selected_fields = ["investment_banks.name", "investment_banks.ceo_name"]

            fields_to_select = ", ".join(selected_fields)

            # Base query
            query = f"""
                SELECT {fields_to_select}
                FROM investment_banks
                LEFT JOIN bank_company_relations ON investment_banks.bank_id = bank_company_relations.bank_id
                LEFT JOIN companies ON bank_company_relations.company_id = companies.company_id
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
            if headquarters_location:
                filters.append("investment_banks.headquarters_location LIKE %s")
                params.append(f"%{headquarters_location}%")

            # Filter by industry
            if industry:
                filters.append("investment_banks.industries LIKE %s")
                params.append(f"%{industry}%")

            # Append filters to the query
            if filters:
                query += " AND " + " AND ".join(filters)

            # Group By Clause
            group_by_fields = [
                "investment_banks.bank_id", 
                "investment_banks.name", 
                "investment_banks.headquarters_location", 
                "investment_banks.industries", 
                "investment_banks.ceo_name", 
                "investment_banks.foundation_date"
            ]
            query += " GROUP BY " + ", ".join(group_by_fields)

            # Debugging log
            print(f"Executing query: {query} with params: {params}")

            # Execute the query
            cursor.execute(query, tuple(params))



        elif entity == 'investment_firms':
            query = """
                SELECT * FROM investment_firms
                WHERE name LIKE %s
            """
            params = (f"%{name}%",)


        elif entity == 'portfolios':
            # Base query with placeholders for dynamic display fields
            display_fields = request.args.get('display_fields', '').split(',')
            if not display_fields or display_fields == ['']:
                # Default to select all fields if none are specified
                selected_fields = """
                    portfolios.name AS portfolio_name,
                    portfolios.foundation_date,
                    portfolios.year_end_market_value,
                    portfolios.year_end_holders AS holders,
                    CONCAT(managers.first_name, ' ', managers.last_name) AS manager_name,
                    GROUP_CONCAT(DISTINCT IFNULL(stocks.name, '') SEPARATOR ', ') AS stock_list
                """
            else:
                # Dynamically build the fields to select
                field_mapping = {
                    'portfolio_name': "portfolios.name AS portfolio_name",
                    'foundation_date': "portfolios.foundation_date",
                    'year_end_market_value': "portfolios.year_end_market_value",
                    'holders': "portfolios.year_end_holders AS holders",
                    'manager' : "CONCAT(managers.first_name, ' ', managers.last_name) AS manager",
                    'stock': "GROUP_CONCAT(DISTINCT IFNULL(stocks.name, '') SEPARATOR ', ') AS stock_list"
                }
                selected_fields = ", ".join(field_mapping[field] for field in display_fields if field in field_mapping)

            query = f"""
                SELECT {selected_fields}
                FROM portfolios
                LEFT JOIN managers ON portfolios.manager_id = managers.manager_id
                LEFT JOIN portfolio_stock_relations ON portfolios.portfolio_id = portfolio_stock_relations.portfolio_id
                LEFT JOIN stocks ON portfolio_stock_relations.stock_id = stocks.stock_id
                WHERE 1=1
            """

            filters = []
            params = []

            # Min and Max Year-End Market Value
            min_market_value = request.args.get('min_market_value', None)
            max_market_value = request.args.get('max_market_value', None)
            if min_market_value or max_market_value:
                filters.append("portfolios.year_end_market_value BETWEEN %s AND %s")
                params.extend([min_market_value or 0, max_market_value or float('inf')])

            # Min and Max Year-End Holders
            min_holders = request.args.get('min_holders', None)
            max_holders = request.args.get('max_holders', None)
            if min_holders or max_holders:
                filters.append("portfolios.year_end_holders BETWEEN %s AND %s")
                params.extend([min_holders or 0, max_holders or float('inf')])
            
            # Filter by stock symbol
            stock_symbol = request.args.get('stock_symbol', '').strip()
            if stock_symbol:
                # Filter portfolios containing the specified stock
                filters.append(
                    """
                    EXISTS (
                        SELECT 1
                        FROM portfolio_stock_relations psr
                        JOIN stocks s ON psr.stock_id = s.stock_id
                        WHERE psr.portfolio_id = portfolios.portfolio_id
                        AND s.stock_code LIKE %s
                    )
                    """
                )
                params.append(f"%{stock_symbol}%")

            # Apply filters
            if filters:
                query += " AND " + " AND ".join(filters)
            
            # Group by portfolio ID to aggregate stocks
            query += """
            GROUP BY 
                portfolios.portfolio_id, 
                portfolios.name, 
                portfolios.foundation_date, 
                portfolios.year_end_market_value, 
                portfolios.year_end_holders, 
                managers.first_name, 
                managers.last_name
            """

            # Debugging: Print the query and parameters
            print(f"Selected Fields: {selected_fields}")
            print(f"Executing query: {query}")
            print(f"With parameters: {params}")

            # Execute the query
            cursor.execute(query, tuple(params))

        elif entity == "searching_for":
            entity_set_name = request.args.get('entity_set_name', '').strip()
            search_name = request.args.get('name', '').strip()

            # Basic validation
            if not entity_set_name:
                return jsonify({"error": "entity_set_name is required"}), 400
            if not search_name:
                return jsonify({"error": "name is required"}), 400

            # Construct the query
            # Note: Be sure entity_set_name is trusted or sanitized, as table name cannot be parameterized.
            # In a production scenario, validate that entity_set_name matches an allowed list of tables.
            query = f"SELECT * FROM {entity_set_name} WHERE name = %s"
            params = (search_name,)

            print(f"Executing query: {query} with params: {params}")  # Debugging

            # Execute the query
            cursor.execute(query, params)



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
