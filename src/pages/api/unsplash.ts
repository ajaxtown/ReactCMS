import logger from "../../shared/logger";
const unsplashUrl = "https://api.unsplash.com/search/photos";
const clientId =
  "1424074b20f17701ec8c0601fd15ca686c70e2cb0e645f8137533d8063e664bc";

const unsplash = async (req, res) => {
  const { page, query } = req.query;
  const endpoint = `${unsplashUrl}?client_id=${clientId}&query=${query}&page=${page}&per_page=21`;

  try {
    const response = await fetch(endpoint).then((data) => data.json());
    res.json({
      rows: response.results,
      count: response.total,
      pages: response.total_pages,
    });
  } catch (e) {
    logger.error(e);
    res.json({
      rows: [],
      count: 0,
      pages: 0,
    });
  }
};

export default unsplash;
