import os
import pandas as pd

class Reader:
    def __init__(self):
        self.script_dir = os.path.dirname(os.path.abspath(__file__))
        self.data_folder_path = os.path.join(self.script_dir, '../data')
        # Load the pickle files
        self.companies_df = pd.read_pickle(os.path.join(self.data_folder_path,'companies.pkl'))
        self.stocks_df = pd.read_pickle(os.path.join(self.data_folder_path,'stocks.pkl'))
        self.investment_firms_df = pd.read_pickle(os.path.join(self.data_folder_path,'investment_firms.pkl'))
        self.investment_banks_df = pd.read_pickle(os.path.join(self.data_folder_path,'investment_banks.pkl'))
        self.managers_df = pd.read_pickle(os.path.join(self.data_folder_path,'managers.pkl'))
        self.portfolios_df = pd.read_pickle(os.path.join(self.data_folder_path,'portfolios.pkl'))
        self.portfolio_stock_df = pd.read_pickle(os.path.join(self.data_folder_path,'portfolio_stock_relations.pkl'))
        self.banks_company_relations_df = pd.read_pickle(os.path.join(self.data_folder_path, 'bank_company_relations.pkl'))
    
    def get_company(self):
        return self.companies_df

    def get_stock(self):
        return self.stocks_df
    
    def get_firm(self):
        return self.investment_firms_df
    
    def get_bank(self):
        return self.investment_banks_df
    
    def get_manager(self):
        return self.managers_df
    
    def get_portfolio(self):
        return self.portfolios_df
    
    def get_portfolio_stock(self):
        return self.portfolio_stock_df

    def print_info(self):
        print(self.companies_df)
        print(self.stocks_df)
        print(self.investment_banks_df)
        print(self.investment_firms_df)
        print(self.managers_df)
        print(self.portfolios_df)
        print(self.portfolio_stock_df)


