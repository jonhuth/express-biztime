const express = require("express");
const router = new express.Router();
const db = require("../db");
const ExpressError = require("../expressError")

router.get("/", async function (req, res, next) {
  try {
    const allCompanies = await db.query(`SELECT code, name FROM companies`);

    return res.json({ companies: allCompanies.rows });
  } catch (err) {
    return next(err);
  }

});

router.get("/:code", async function (req, res, next) {
  try {
    const company = await db.query(
      `SELECT code, name, description FROM companies 
        WHERE code = $1`,
      [req.params.code]);
    if (company.rows.length === 0) throw new ExpressError("valid code required", 404);

    const invoices = await db.query(
      `SELECT id
        FROM invoices i 
        where i.comp_code=$1`,
        [req.params.code]
    )
    company.rows[0].invoices = invoices.rows.map(el => el.id);

    return res.json({ company: company.rows[0] })
  } catch (err) {
    return next(err);
  }
});

router.post("/", async function (req, res, next) {
  try {
    const { code, name, description } = req.body;
    // let codeSlug = slugify(name, {lower: true});

    const company = await db.query(
      `SELECT code FROM companies 
        WHERE code = $1`,
      [code]);
    
      //expect company.rows to be empty
    if (company.rows.length !== 0) throw new ExpressError("record already exists", 400);
    
      const result = await db.query(
      `INSERT INTO companies (code, name, description)
        VALUES ($1, $2, $3)
        RETURNING code, name, description`,
      [code, name, description]);

    return res.status(201).json({ company: result.rows[0] });
  } catch (err) {
    return next(err);
  }
});

router.put("/:code", async function (req, res, next) {
  try {

    const code = req.params.code;
    const { name, description } = req.body;

    if (Object.keys(req.body).length !== 2) throw new ExpressError("please input name and description", 400);

    const result = await db.query(
      `UPDATE companies SET name=$1, description=$2
        WHERE code = $3
        RETURNING code, name, description`,
      [name, description, code])

    if (result.rows.length === 0) throw new ExpressError("Did not update; code does not match valid code", 404);

    return res.json({ company: result.rows[0] });

  } catch (err) {
    return next(err);
  }
});

router.delete("/:code", async function (req, res, next) {
  try {
    const result = await db.query(
      `DELETE FROM companies WHERE code = $1
        RETURNING code`,
      [req.params.code]);
    if (result.rows.length === 0) throw new ExpressError("code does not exist", 404);

    return res.json({ status: "deleted" });

  } catch (err) {
    return next(err);
  }
});

module.exports = router;
