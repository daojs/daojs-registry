function validator(/* { registry, loaders } */) {
  function validateComponent({
    description,
    dependencies,
    type,
    source,
    sourceDebug,
    readme,
  }) {
    return {
      description,
      dependencies,
      type,
      source,
      sourceDebug,
      readme,
    };
  }

  return {
    validateComponent,
  };
}

module.exports = validator;
