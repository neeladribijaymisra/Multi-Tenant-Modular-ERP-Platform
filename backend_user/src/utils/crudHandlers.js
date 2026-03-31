export function listDocuments(Model, queryBuilder) {
  return async (req, res, next) => {
    try {
      const tenantSlug = req.params.tenant;
      const query = queryBuilder ? queryBuilder(req) : {};
      const items = await Model.find({ tenantSlug, ...query }).sort({ createdAt: -1 });
      res.json(items);
    } catch (error) {
      next(error);
    }
  };
}

export function createDocument(Model) {
  return async (req, res, next) => {
    try {
      const item = await Model.create({
        ...req.body,
        tenantSlug: req.params.tenant,
      });
      res.status(201).json(item);
    } catch (error) {
      next(error);
    }
  };
}

export function updateDocument(Model) {
  return async (req, res, next) => {
    try {
      const item = await Model.findOneAndUpdate(
        { _id: req.params.id, tenantSlug: req.params.tenant },
        req.body,
        { new: true, runValidators: true },
      );

      if (!item) {
        return res.status(404).json({ message: "Record not found" });
      }

      res.json(item);
    } catch (error) {
      next(error);
    }
  };
}

export function deleteDocument(Model) {
  return async (req, res, next) => {
    try {
      const item = await Model.findOneAndDelete({
        _id: req.params.id,
        tenantSlug: req.params.tenant,
      });

      if (!item) {
        return res.status(404).json({ message: "Record not found" });
      }

      res.json({ message: "Deleted successfully" });
    } catch (error) {
      next(error);
    }
  };
}
