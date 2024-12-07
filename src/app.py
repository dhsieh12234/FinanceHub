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
    name = request.args.get('name')
    firstname = request.args.get('firstname') == 'true'  # Convert to boolean
    lastname = request.args.get('lastname') == 'true'    # Convert to boolean

    if not writer_instance:
        return jsonify({"error": "Database not initialized. Please submit the password first."})

    try:
        connection = writer_instance.connect_to_database()
        cursor = connection.cursor(dictionary=True)
        # Query the database
        if entity == 'managers':
            if firstname:
                query = f"SELECT * FROM {entity} WHERE first_name LIKE %s"
            if lastname:
                query = f"SELECT * FROM {entity} WHERE last_name LIKE %s"
            cursor.execute(query, (f"%{name}%", f"%{name}%"))
        else:
            query = f"SELECT * FROM {entity} WHERE name LIKE %s"
            cursor.execute(query, (f"%{name}%",))
        results = cursor.fetchall()

        return jsonify(results)
    except mysql.connector.Error as error:
        return jsonify({"error": str(error)})
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()

if __name__ == '__main__':
    app.run(debug=True)
