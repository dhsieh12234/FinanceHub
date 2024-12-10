import mysql.connector
import pandas as pd


def connect_to_database():
    db_config = {
        'host': 'localhost',
        'user': 'root',
        'password': 'PUT YOUR PASSWORD'
    }
    try:
        connection = mysql.connector.connect(**db_config)
        cursor = connection.cursor()
        cursor.execute("CREATE DATABASE IF NOT EXISTS financial_db")
        connection.close()
        db_config['database'] = 'financial_db'
        connection = mysql.connector.connect(**db_config)
        print("Successfully connected to the database!")
        return connection
    except mysql.connector.Error as error:
        print(f"Error connecting to database: {error}")
        return None

def create_tables(connection):
    cursor = connection.cursor()

    try:
        # Drop existing tables in correct order
        cursor.execute("DROP TABLE IF EXISTS Bank_Company_Relations")
        cursor.execute("DROP TABLE IF EXISTS Portfolio_Stock_Relations")
        cursor.execute("DROP TABLE IF EXISTS Portfolios")
        cursor.execute("DROP TABLE IF EXISTS Managers")
        cursor.execute("DROP TABLE IF EXISTS Stocks")
        cursor.execute("DROP TABLE IF EXISTS Companies")
        cursor.execute("DROP TABLE IF EXISTS Investment_Firms")
        cursor.execute("DROP TABLE IF EXISTS Investment_Banks")

        # Create tables with integer IDs
        cursor.execute("""
        CREATE TABLE Companies (
            company_id INT PRIMARY KEY,
            name VARCHAR(255),
            location VARCHAR(255),
            phone_number VARCHAR(50),
            CEO_name VARCHAR(255),
            industry VARCHAR(255),
            company_info TEXT
        )""")

        cursor.execute("""
        CREATE TABLE Stocks (
            stock_id INT PRIMARY KEY,
            company_id INT,
            stock_code VARCHAR(20),
            name VARCHAR(255),
            year_end_price FLOAT,
            year_end_shares BIGINT,
            year_end_market_value BIGINT,
            FOREIGN KEY (company_id) REFERENCES Companies(company_id)
        )""")

        cursor.execute("""
        CREATE TABLE Investment_Firms (
            firm_id INT PRIMARY KEY,
            name VARCHAR(255),
            foundation_date DATE,
            num_managers INT,
            CEO_name VARCHAR(255),
            national_ranking INT
        )""")

        cursor.execute("""
        CREATE TABLE Investment_Banks (
            bank_id INT PRIMARY KEY,
            name VARCHAR(255),
            foundation_date DATE,
            industries VARCHAR(255),
            headquarters_location VARCHAR(255),
            CEO_name VARCHAR(255)
        )""")

        cursor.execute("""
        CREATE TABLE Managers (
            manager_id INT PRIMARY KEY,
            firm_id INT,
            first_name VARCHAR(255),
            last_name VARCHAR(255),
            years_experience INT,
            investment_expertise VARCHAR(255),
            personal_intro TEXT,
            FOREIGN KEY (firm_id) REFERENCES Investment_Firms(firm_id)
        )""")

        cursor.execute("""
        CREATE TABLE Portfolios (
            portfolio_id INT PRIMARY KEY,
            manager_id INT,
            name VARCHAR(255),
            foundation_date DATE,
            year_end_market_value BIGINT,
            year_end_holders INT,
            FOREIGN KEY (manager_id) REFERENCES Managers(manager_id)
        )""")

        cursor.execute("""
        CREATE TABLE Portfolio_Stock_Relations (
            portfolio_id INT,
            stock_id INT,
            percentage FLOAT,
            PRIMARY KEY (portfolio_id, stock_id),
            FOREIGN KEY (portfolio_id) REFERENCES Portfolios(portfolio_id),
            FOREIGN KEY (stock_id) REFERENCES Stocks(stock_id)
        )""")

        cursor.execute("""
        CREATE TABLE Bank_Company_Relations (
            relation_id INT PRIMARY KEY,
            bank_id INT,
            company_id INT,
            monthly_billables INT,
            managing_director VARCHAR(255),
            FOREIGN KEY (bank_id) REFERENCES Investment_Banks(bank_id),
            FOREIGN KEY (company_id) REFERENCES Companies(company_id)
        )""")

        connection.commit()
        print("Tables created successfully!")

    except mysql.connector.Error as error:
        print(f"Error creating tables: {error}")

def load_data_to_database():
    connection = connect_to_database()
    if not connection:
        return

    create_tables(connection)
    cursor = connection.cursor()

    try:
        # Load pickle files
        companies_df = pd.read_pickle('data/companies.pkl')
        stocks_df = pd.read_pickle('data/stocks.pkl')
        investment_firms_df = pd.read_pickle('data/investment_firms.pkl')
        investment_banks_df = pd.read_pickle('data/investment_banks.pkl')
        managers_df = pd.read_pickle('data/managers.pkl')
        portfolios_df = pd.read_pickle('data/portfolios.pkl')
        bank_company_df = pd.read_pickle('data/bank_company_relations.pkl')

        # Insert data into tables
        print("Loading Companies...")
        for _, row in companies_df.iterrows():
            cursor.execute("""
            INSERT INTO Companies 
            (company_id, name, location, phone_number, CEO_name, industry, company_info)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, tuple(row))

        print("Loading Stocks...")
        for _, row in stocks_df.iterrows():
            cursor.execute("""
            INSERT INTO Stocks 
            (stock_id, company_id, stock_code, name, year_end_price, year_end_shares, year_end_market_value)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, tuple(row))

        print("Loading Investment Firms...")
        for _, row in investment_firms_df.iterrows():
            cursor.execute("""
            INSERT INTO Investment_Firms 
            (firm_id, name, foundation_date, num_managers, CEO_name, national_ranking)
            VALUES (%s, %s, %s, %s, %s, %s)
            """, tuple(row))

        print("Loading Investment Banks...")
        for _, row in investment_banks_df.iterrows():
            cursor.execute("""
            INSERT INTO Investment_Banks 
            (bank_id, name, foundation_date, industries, headquarters_location, CEO_name)
            VALUES (%s, %s, %s, %s, %s, %s)
            """, tuple(row))

        print("Loading Managers...")
        for _, row in managers_df.iterrows():
            cursor.execute("""
            INSERT INTO Managers 
            (manager_id, firm_id, first_name, last_name, years_experience, investment_expertise, personal_intro)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, tuple(row))

        print("Loading Portfolios...")
        for _, row in portfolios_df.iterrows():
            cursor.execute("""
            INSERT INTO Portfolios 
            (portfolio_id, manager_id, name, foundation_date, year_end_market_value, year_end_holders)
            VALUES (%s, %s, %s, %s, %s, %s)
            """, tuple(row))

        print("Loading Bank-Company Relations...")
        for _, row in bank_company_df.iterrows():
            cursor.execute("""
            INSERT INTO Bank_Company_Relations 
            (relation_id, bank_id, company_id, monthly_billables, managing_director)
            VALUES (%s, %s, %s, %s, %s)
            """, tuple(row))

        connection.commit()
        print("Data loaded successfully!")

    except mysql.connector.Error as error:
        print(f"Error loading data: {error}")
        connection.rollback()
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()
            print("Database connection closed.")

if __name__ == "__main__":
    load_data_to_database()