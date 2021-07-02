import models from "../models";

models.sequelize.sync({ alter: { drop: false } });
