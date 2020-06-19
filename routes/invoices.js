const express = require("express");
const router = new express.Router();
const db = require("../db");
const ExpressError = require("../expressError")

router.get("/", async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT id, comp_code
        FROM invoices`
    );
    return res.json({invoices: result.rows})
  } catch(err) {
    return next(err);
  }
  
});

router.get("/:id", async (req, res, next) => {
  try {
    
    const result = await db.query(
        `SELECT id, amt, paid, add_date, paid_date, comp_code company
          FROM invoices
          WHERE id=$1`,
          [req.params.id]
    );

    if(!result.rows.length) {
      throw new ExpressError("Not a valid invoice: id not found.", 404);
    }

    // use company to find company information
    const resCompany = await db.query(
      `SELECT code, name, description
        FROM companies
        WHERE code=$1`,
        [result.rows[0].company]
    );

    result.rows[0].company = resCompany.rows[0];


    return res.json({invoice : result.rows[0]});
  } catch(err) {
    return next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { comp_code, amt } = req.body;

    const company = await db.query(
      `SELECT code
        FROM companies
        WHERE code=$1`,
        [comp_code]
    );
    if(!company.rows.length) {
      throw new ExpressError("Cannot add invoice: company does not exist in DB", 404);
    }

    // can't add into db, invoices for companies not in companies table
    const result = await db.query(
      `INSERT into invoices (comp_code, amt)
        VALUES ($1, $2)
        RETURNING id, comp_code, amt, paid, add_date, paid_date`,
      [comp_code, amt]
    );

    // console.log(result);
    return res.json({invoice: result.rows[0]});
  } catch(err) {
    return next(err);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const { amt } = req.body;

    const invoice = await db.query(
      `SELECT id
        FROM invoices
        WHERE id=$1`,
        [req.params.id]
    );
    if(!invoice.rows.length) {
      throw new ExpressError("Cannot update: invoice cannot be found", 404);
    }

    const result = await db.query(
      `UPDATE invoices SET amt=$1
        WHERE id=$2
        RETURNING id, comp_code, amt, paid, add_date, paid_date`,
        [amt, req.params.id]
    );

    return res.json({invoice: result.rows[0]});
  } catch(err) {
    return next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {

    const invoice = await db.query(
      `SELECT id
        FROM invoices
        WHERE id=$1`,
        [req.params.id]
    );

    if(!invoice.rows.length) {
      throw new ExpressError("Cannot update: invoice cannot be found", 404);
    }

    const result = await db.query(
      `DELETE from invoices
        WHERE id=$1
        RETURNING id`,
        [req.params.id]
    );

    return res.json({status: "deleted"});

  } catch(err) {
    return next(err);
  }
});

module.exports = router;
