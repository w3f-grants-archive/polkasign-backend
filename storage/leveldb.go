package storage

import "github.com/syndtr/goleveldb/leveldb"

var ldb *leveldb.DB

func InitLevelDB() {
	var err error
	ldb, err = leveldb.OpenFile("data.ldb", nil)
	if err != nil {
		panic(err)
	}
}

func GetLevelDB() *leveldb.DB {
	return ldb
}
