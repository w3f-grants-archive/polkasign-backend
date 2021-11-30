package graph

// This file will be automatically regenerated based on the schema, any resolver implementations
// will be copied through when generating and any unknown code will be moved to the end.

import (
	"context"
	"errors"
	"fmt"

	"github.com/polkasign/polkasign-backend/graph/generated"
	"github.com/polkasign/polkasign-backend/graph/model"
	"github.com/polkasign/polkasign-backend/storage"
	"gorm.io/gorm"
)

func (r *mutationResolver) CreateAgreementInfo(ctx context.Context, input model.NewAgreementInfo) (*model.AgreementInfo, error) {
	gdb := storage.GetGormDB()
	first := gdb.Where("`index` = ?", input.Index).First(&model.AgreementInfo{})
	if first.Error == gorm.ErrRecordNotFound {
		item := &model.AgreementInfo{
			Index:         input.Index,
			TxID:          input.TxID,
			Creator:       input.Creator,
			Name:          input.Name,
			CreateAt:      input.CreateAt,
			Status:        input.Status,
			Signers:       input.Signers,
			AgreementFile: input.AgreementFile,
			SignInfos:     input.SignInfos,
			Resources:     input.Resources,
		}
		if err := gdb.Create(item).Error; err != nil {
			return nil, err
		}
		return item, nil
	}

	return r.UpdateAgreementInfo(ctx, input)
}

func (r *mutationResolver) UpdateAgreementInfo(ctx context.Context, input model.NewAgreementInfo) (*model.AgreementInfo, error) {
	gdb := storage.GetGormDB()
	item := &model.AgreementInfo{
		Index:         input.Index,
		Creator:       input.Creator,
		Name:          input.Name,
		CreateAt:      input.CreateAt,
		Status:        input.Status,
		Signers:       input.Signers,
		AgreementFile: input.AgreementFile,
		SignInfos:     input.SignInfos,
		Resources:     input.Resources,
	}
	updateDB := gdb.Model(&model.AgreementInfo{}).
		Where("`index` = ?", item.Index).
		Updates(item)

	if updateDB.Error != nil {
		return nil, updateDB.Error
	}

	if updateDB.RowsAffected < 1 {
		return nil, errors.New("cannot find record by index")
	}

	return item, nil
}

func (r *queryResolver) AgreementInfos(ctx context.Context, filter model.Filter, page model.PagingParam) (*model.PagingResult, error) {
	gdb := storage.GetGormDB()
	var infos []*model.AgreementInfo
	querySeg := gdb.Model(&model.AgreementInfo{})
	if filter.Creator != "" {
		querySeg.Where("creator = ?", filter.Creator)
	}
	if filter.Signer != "" {
		querySeg.Where("signers like ?", fmt.Sprintf("%%,%v,%%", filter.Signer))
	}
	if len(filter.Status) > 0 {
		querySeg.Where("status in ?", filter.Status)
	}
	if page.Order != "" && page.SortField != "" {
		querySeg.Order(fmt.Sprintf("`%v` %v", page.SortField, page.Order))
	}

	var total int64
	if err := querySeg.Count(&total).Error; err != nil {
		return nil, err
	}
	querySeg.Offset(page.Size * page.Page).
		Limit(page.Size)
	if err := querySeg.Find(&infos).Error; err != nil {
		return nil, err
	}

	return &model.PagingResult{
		Page:  page.Page,
		Size:  page.Size,
		Total: int(total),
		Data:  infos,
	}, nil
}

// Mutation returns generated.MutationResolver implementation.
func (r *Resolver) Mutation() generated.MutationResolver { return &mutationResolver{r} }

// Query returns generated.QueryResolver implementation.
func (r *Resolver) Query() generated.QueryResolver { return &queryResolver{r} }

type mutationResolver struct{ *Resolver }
type queryResolver struct{ *Resolver }
