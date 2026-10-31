from datetime import datetime, timedelta, date

def get_period_dates(period=None, date_str=None, start_date=None, end_date=None):
    """
    Computes (start_datetime, end_datetime, label) for date-wise candidate filtering.
    Supports:
      - 'today' / 'daily'
      - 'this_week' / 'weekly'
      - 'this_month' / 'monthly'
      - custom date_str (YYYY-MM-DD)
      - custom start_date to end_date
    """
    now = datetime.utcnow()
    today = now.date()

    if period in ("today", "daily") or (not period and date_str and not (start_date or end_date)):
        if date_str:
            try:
                t_date = datetime.strptime(date_str, "%Y-%m-%d").date()
            except ValueError:
                t_date = today
        else:
            t_date = today

        s = datetime(t_date.year, t_date.month, t_date.day, 0, 0, 0)
        e = datetime(t_date.year, t_date.month, t_date.day, 23, 59, 59, 999999)
        return s, e, f"daily_{t_date.strftime('%Y-%m-%d')}"

    elif period in ("this_week", "weekly", "week"):
        monday = today - timedelta(days=today.weekday())
        sunday = monday + timedelta(days=6)
        s = datetime(monday.year, monday.month, monday.day, 0, 0, 0)
        e = datetime(sunday.year, sunday.month, sunday.day, 23, 59, 59, 999999)
        return s, e, f"weekly_{monday.strftime('%Y-%m-%d')}_to_{sunday.strftime('%Y-%m-%d')}"

    elif period in ("this_month", "monthly", "month"):
        s = datetime(today.year, today.month, 1, 0, 0, 0)
        if today.month == 12:
            next_m = datetime(today.year + 1, 1, 1, 0, 0, 0)
        else:
            next_m = datetime(today.year, today.month + 1, 1, 0, 0, 0)
        e = next_m - timedelta(microseconds=1)
        return s, e, f"monthly_{today.strftime('%Y-%m')}"

    elif start_date or end_date:
        s = datetime.strptime(start_date, "%Y-%m-%d") if start_date else datetime(2000, 1, 1, 0, 0, 0)
        e = datetime.strptime(end_date + " 23:59:59", "%Y-%m-%d %H:%M:%S") if end_date else datetime(2100, 1, 1, 23, 59, 59)
        s_lbl = start_date if start_date else "start"
        e_lbl = end_date if end_date else "end"
        return s, e, f"range_{s_lbl}_to_{e_lbl}"

    return None, None, f"all_{today.strftime('%Y-%m-%d')}"
