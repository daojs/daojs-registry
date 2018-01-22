module.exports = function resolve(/* options */) {
  return (req, res) => {
    res.send('Hello, resolver!');
  };
};
