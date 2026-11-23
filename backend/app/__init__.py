"""Café Fausse API — Flask application factory."""

import logging

from flask import Flask
from flask_cors import CORS
from sqlalchemy.exc import OperationalError
from werkzeug.exceptions import HTTPException

from .cli import register_cli
from .config import Config
from .db import db
from .routes import api


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)
    app.json.sort_keys = False

    db.init_app(app)
    CORS(app, resources={r"/api/*": {"origins": app.config["CORS_ORIGINS"]}})
    app.register_blueprint(api)
    register_cli(app)
    _register_error_handlers(app)
    return app


def _register_error_handlers(app):
    @app.errorhandler(HTTPException)
    def http_error(err):
        return {"error": err.name.lower().replace(" ", "_"), "message": err.description}, err.code

    @app.errorhandler(OperationalError)
    def db_unavailable(err):
        logging.getLogger(__name__).exception("Database unavailable")
        db.session.rollback()
        return {
            "error": "service_unavailable",
            "message": "Our reservation system is temporarily unavailable. "
            "Please try again shortly or call us at (202) 555-4567.",
        }, 503

    @app.errorhandler(Exception)
    def unexpected(err):
        logging.getLogger(__name__).exception("Unhandled error")
        db.session.rollback()
        return {
            "error": "server_error",
            "message": "Something went wrong on our side. Please try again, "
            "or call us at (202) 555-4567.",
        }, 500
