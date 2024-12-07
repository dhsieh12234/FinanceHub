import mysql.connector
import pandas as pd
import reader

class Writer:
    def __init__(self):
        self.reader = reader.Reader()
    
    def connect_to_database(self):
        # First connect without database specified
        db_config = {
            'host': 'localhost',
            'user': 'root',
            'password': 'YOURPASSWORDHERE'
        }
        try:
            connection = mysql.connector.connect(**db_config)
            cursor = connection.cursor()

            # Create database if it doesn't exist
            cursor.execute("CREATE DATABASE IF NOT EXISTS financial_db")

            # Then connect to the new database
            connection.close()
            db_config['database'] = 'financial_db'
            connection = mysql.connector.connect(**db_config)

            print("Successfully connected to the database!")
            return connection
        except mysql.connector.Error as error:
            print(f"Error connecting to database: {error}")
            return None

    def create_tables(self, connection):
        cursor = connection.cursor()

        try:
            # Drop existing tables in correct order (due to foreign key constraints)
            cursor.execute("DROP TABLE IF EXISTS Portfolio_Stock_Relations")
            cursor.execute("DROP TABLE IF EXISTS Portfolios")
            cursor.execute("DROP TABLE IF EXISTS Managers")
            cursor.execute("DROP TABLE IF EXISTS Stocks")
            cursor.execute("DROP TABLE IF EXISTS Companies")
            cursor.execute("DROP TABLE IF EXISTS Investment_Firms")
            cursor.execute("DROP TABLE IF EXISTS Investment_Banks")

            # Create tables
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS Companies (
                name VARCHAR(255) PRIMARY KEY,
                location VARCHAR(255),
                phone_number VARCHAR(50),
                CEO_name VARCHAR(255),
                industry VARCHAR(255),
                company_info TEXT
            )""")

            cursor.execute("""
            CREATE TABLE IF NOT EXISTS Stocks (
                stock_code VARCHAR(20) PRIMARY KEY,
                company_name VARCHAR(255),
                name VARCHAR(255),
                year_end_price FLOAT,
                year_end_shares BIGINT,
                year_end_market_value BIGINT,
                FOREIGN KEY (company_name) REFERENCES Companies(name)
            )""")

            cursor.execute("""
            CREATE TABLE IF NOT EXISTS Investment_Firms (
                name VARCHAR(255) PRIMARY KEY,
                foundation_date DATE,
                num_managers INT,
                CEO_name VARCHAR(255),
                national_ranking INT
            )""")

            cursor.execute("""
            CREATE TABLE IF NOT EXISTS Investment_Banks (
                name VARCHAR(255) PRIMARY KEY,
                foundation_date DATE,
                industries VARCHAR(255),
                headquarters_location VARCHAR(255),
                CEO_name VARCHAR(255)
            )""")

            cursor.execute("""
            CREATE TABLE IF NOT EXISTS Managers (
                certification_ID VARCHAR(20) PRIMARY KEY,
                investment_firm_name VARCHAR(255),
                first_name VARCHAR(255),
                last_name VARCHAR(255),
                years_experience INT,
                investment_expertise VARCHAR(255),
                personal_intro TEXT,
                FOREIGN KEY (investment_firm_name) REFERENCES Investment_Firms(name)
            )""")

            cursor.execute("""
            CREATE TABLE IF NOT EXISTS Portfolios (
                portfolio_code VARCHAR(20) PRIMARY KEY,
                manager_ID VARCHAR(20),
                name VARCHAR(255),
                foundation_date DATE,
                year_end_market_value BIGINT,
                year_end_holders INT,
                FOREIGN KEY (manager_ID) REFERENCES Managers(certification_ID)
            )""")

            cursor.execute("""
            CREATE TABLE IF NOT EXISTS Portfolio_Stock_Relations (
                portfolio_code VARCHAR(20),
                stock_code VARCHAR(20),
                percentage FLOAT,
                PRIMARY KEY (portfolio_code, stock_code),
                FOREIGN KEY (portfolio_code) REFERENCES Portfolios(portfolio_code),
                FOREIGN KEY (stock_code) REFERENCES Stocks(stock_code)
            )""")

            connection.commit()
            print("Tables created successfully!")

        except mysql.connector.Error as error:
            print(f"Error creating tables: {error}")


    def load_data_to_database(self):
        connection = self.connect_to_database()
        if not connection:
            return

        self.create_tables(connection)
        cursor = connection.cursor()

        try:
            # Load pickle files
            companies_df = self.reader.get_company()
            stocks_df = self.reader.get_stock()
            investment_firms_df = self.reader.get_firm()
            investment_banks_df = self.reader.get_bank()
            managers_df = self.reader.get_manager()
            portfolios_df = self.reader.get_portfolio()
            portfolio_stock_df = self.reader.get_portfolio_stock()

            # Insert data into tables
            print("Loading Companies...")
            for _, row in companies_df.iterrows():
                cursor.execute("""
                INSERT INTO Companies (name, location, phone_number, CEO_name, industry, company_info)
                VALUES (%s, %s, %s, %s, %s, %s)
                """, tuple(row))

            print("Loading Stocks...")
            for _, row in stocks_df.iterrows():
                cursor.execute("""
                INSERT INTO Stocks (stock_code, company_name, name, year_end_price, year_end_shares, year_end_market_value)
                VALUES (%s, %s, %s, %s, %s, %s)
                """, tuple(row))

            print("Loading Investment Firms...")
            for _, row in investment_firms_df.iterrows():
                cursor.execute("""
                INSERT INTO Investment_Firms (name, foundation_date, num_managers, CEO_name, national_ranking)
                VALUES (%s, %s, %s, %s, %s)
                """, tuple(row))

            print("Loading Investment Banks...")
            for _, row in investment_banks_df.iterrows():
                cursor.execute("""
                INSERT INTO Investment_Banks (name, foundation_date, industries, headquarters_location, CEO_name)
                VALUES (%s, %s, %s, %s, %s)
                """, tuple(row))

            print("Loading Managers...")
            for _, row in managers_df.iterrows():
                cursor.execute("""
                INSERT INTO Managers (certification_ID, investment_firm_name, first_name, last_name, 
                                    years_experience, investment_expertise, personal_intro)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                """, tuple(row))

            print("Loading Portfolios...")
            for _, row in portfolios_df.iterrows():
                cursor.execute("""
                INSERT INTO Portfolios (portfolio_code, manager_ID, name, foundation_date, 
                                    year_end_market_value, year_end_holders)
                VALUES (%s, %s, %s, %s, %s, %s)
                """, tuple(row))

            print("Loading Portfolio-Stock Relations...")
            for _, row in portfolio_stock_df.iterrows():
                cursor.execute("""
                INSERT INTO Portfolio_Stock_Relations (portfolio_code, stock_code, percentage)
                VALUES (%s, %s, %s)
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


