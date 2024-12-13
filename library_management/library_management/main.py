import psycopg2
from decouple import config


def main():
    conn = psycopg2.connect(config('DATABASE_HOST'),)

    query_sql = 'SELECT VERSION()'

    cur = conn.cursor()
    cur.execute(query_sql)

    version = cur.fetchone()[0]
    print(version)


if __name__ == "__main__":
    main()