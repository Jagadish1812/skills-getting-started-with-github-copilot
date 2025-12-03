import pytest
from copy import deepcopy
from urllib.parse import quote
from fastapi.testclient import TestClient

import src.app as appmod

client = TestClient(appmod.app)
_original = deepcopy(appmod.activities)

@pytest.fixture(autouse=True)
def reset_activities():
    # Reset the in-memory activities before each test
    appmod.activities = deepcopy(_original)
    yield
    appmod.activities = deepcopy(_original)


def test_get_activities():
    r = client.get("/activities")
    assert r.status_code == 200
    data = r.json()
    assert "Chess Club" in data
    assert isinstance(data["Chess Club"]["participants"], list)


def test_signup_and_duplicate():
    email = "newstudent@mergington.edu"
    activity = "Chess Club"

    r = client.post(f"/activities/{quote(activity)}/signup?email={quote(email)}")
    assert r.status_code == 200
    assert email in r.json()["message"]

    # verify present
    r2 = client.get("/activities")
    assert email in r2.json()[activity]["participants"]

    # duplicate signup should fail
    r3 = client.post(f"/activities/{quote(activity)}/signup?email={quote(email)}")
    assert r3.status_code == 400


def test_unregister_participant():
    email = "toremove@mergington.edu"
    activity = "Programming Class"

    # add first
    r = client.post(f"/activities/{quote(activity)}/signup?email={quote(email)}")
    assert r.status_code == 200

    # now delete
    r2 = client.delete(f"/activities/{quote(activity)}/participants?email={quote(email)}")
    assert r2.status_code == 200

    # ensure removed
    r3 = client.get("/activities")
    assert email not in r3.json()[activity]["participants"]


def test_unregister_nonexistent():
    activity = "Math Olympiad"
    email = "notexists@mergington.edu"
    r = client.delete(f"/activities/{quote(activity)}/participants?email={quote(email)}")
    assert r.status_code == 404
