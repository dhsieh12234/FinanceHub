import os, sys
import writer

def main():
    passwd = input ("Local host password:")
    sys_ad = writer.Writer(passwd)
    sys_ad.load_data_to_database()

if __name__ == '__main__':
    main()
