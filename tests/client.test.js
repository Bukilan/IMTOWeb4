const client = require("../src/js/index.js");

describe('getCoordinates()', () => {
    it('180deg это юг', () => {
        expect(client.getCoordinates(180)).toBe('Юг');
    });

    it('350deg это северо-запад', () => {
        expect(client.getCoordinates(350)).toBe('Северо-Запад');
    });
});

describe('getCurrentPositionAsync()', () => {
    it('Возвращается объект с нужными полями', () => {

        const expectedList = {
            coords: {
                latitude: '1',
                longitude: '2',
            }
        }

        global.navigator.geolocation = {
            getCurrentPosition: jest.fn(() => expectedList),
        };

        client.getCurrentPositionAsync().then(data => expect(data.coords).toHaveProperty('latitude', 'longitude'));
        client.getCurrentPositionAsync().then(data => expect(data.coords).toEqual( {
            latitude: '1',
            longitude: '2',
        }));
    });
});
