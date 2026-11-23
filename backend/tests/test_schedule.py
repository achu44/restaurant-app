from datetime import date, datetime

from app.schedule import slot_error, slots_for_date

NOW = datetime(2026, 11, 22, 12, 0)  # a Sunday


def test_weekday_slots_run_5pm_to_10pm():
    slots = slots_for_date(date(2026, 11, 24))  # Tuesday
    assert slots[0].time().isoformat() == "17:00:00"
    assert slots[-1].time().isoformat() == "22:00:00"
    assert len(slots) == 11


def test_sunday_slots_run_5pm_to_8pm():
    slots = slots_for_date(date(2026, 11, 29))
    assert slots[-1].time().isoformat() == "20:00:00"
    assert len(slots) == 7


def test_valid_slot():
    assert slot_error(datetime(2026, 11, 24, 19, 30), NOW) is None


def test_rejects_outside_hours_and_misaligned():
    assert slot_error(datetime(2026, 11, 24, 12, 0), NOW)
    assert slot_error(datetime(2026, 11, 24, 19, 15), NOW)
    assert slot_error(datetime(2026, 11, 29, 20, 30), NOW)  # Sunday after last seating


def test_rejects_past_and_too_far_ahead():
    assert "passed" in slot_error(datetime(2026, 11, 21, 19, 0), NOW)
    assert slot_error(datetime(2027, 3, 2, 19, 0), NOW)
