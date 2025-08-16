process.env.JWT_ACCESS_SECRET  ||= "test_access_secret";
process.env.JWT_REFRESH_SECRET ||= "test_refresh_secret";
process.env.ACCESS_EXPIRES_IN  ||= "15m";
process.env.REFRESH_EXPIRES_IN ||= "7d";
process.env.REPORT_QUEUE       ||= "daily_sales_report";
process.env.TZ                 ||= "Europe/Amsterdam";
process.env.CORS_ORIGINS       ||= "http://localhost:8080";