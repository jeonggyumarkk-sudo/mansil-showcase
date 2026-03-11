try {
    const db = require('@mansil/database');
    console.log('Success:', Object.keys(db));
} catch (e) {
    console.error('Error:', e);
}
